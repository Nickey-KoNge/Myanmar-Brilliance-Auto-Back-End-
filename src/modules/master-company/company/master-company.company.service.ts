import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // ILike removed as it's unused in current logic
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { PaginateCompaniesDto } from './dtos/paginate-companies.dto';
import { SelectQueryBuilder } from 'typeorm';
import { OpService } from 'src/common/service/op.service';
import { IFileService } from 'src/common/service/i-file.service';
import { OptimizeImageService } from 'src/common/service/optimize-image.service';

@Injectable()
export class MasterCompanyCompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @Inject(IFileService)
    private readonly fileService: IFileService,
    private readonly opService: OpService,
    private readonly optimizeImageService: OptimizeImageService,
  ) {}

  async findActive(limit: number = 100): Promise<Company[]> {
    return await this.companyRepository.find({
      where: { status: 'Active' },
      select: ['id', 'company_name'],
      take: limit,
    });
  }

  async findByIds(ids: string[]): Promise<Company[]> {
    if (!ids || ids.length === 0) return [];
    return await this.companyRepository.find({
      where: { id: In(ids) },
    });
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['branches'],
      select: {
        id: true,
        company_name: true,
        branches: {
          id: true,
          branches_name: true,
        },
      },
    });
    if (!company)
      throw new NotFoundException(`Company with ID ${id} not found`);
    return company;
  }

  async create(
    createCompanyDto: CreateCompanyDto,
    file: Express.Multer.File,
  ): Promise<Company> {
    if (!file) throw new Error('No file uploaded');

    const optimizedFile = await this.optimizeImageService.optimizeImage(file);
    const imageUrl = await this.fileService.uploadFile(
      optimizedFile,
      'company',
    );

    return await this.opService.create<Company>(this.companyRepository, {
      ...createCompanyDto,
      image: imageUrl,
    });
  }

  async findAll(query: PaginateCompaniesDto) {
    const { limit, page, lastId, lastCreatedAt, search, startDate, endDate } =
      query;

    const queryBuilder = this.companyRepository.createQueryBuilder('company');

    // 1. Dynamic Filters (Search & Date Range)
    if (search) {
      queryBuilder.andWhere(
        `(company.company_name ILike :search 
          OR company.email ILike :search 
          OR company.phone ILike :search)`,
        { search: `%${search}%` },
      );
    }

    if (startDate || endDate) {
      if (startDate)
        queryBuilder.andWhere('company.created_at >= :startDate', {
          startDate: `${startDate} 00:00:00`,
        });
      if (endDate)
        queryBuilder.andWhere('company.created_at <= :endDate', {
          endDate: `${endDate} 23:59:59`,
        });
    }

    if (lastId && lastCreatedAt && lastId !== 'undefined') {
      queryBuilder.andWhere(
        '(company.created_at < :lastCreatedAt OR (company.created_at = :lastCreatedAt AND company.id < :lastId))',
        { lastCreatedAt, lastId },
      );
    } else {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip);
    }

    const data = await queryBuilder
      .orderBy('company.created_at', 'DESC')
      .addOrderBy('company.id', 'DESC')
      .take(limit)
      .getMany();

    // 3. High-Performance Total Counting
    const total = await this.getOptimizedCount(
      queryBuilder,
      !!(search || startDate || endDate),
    );

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
    };
  }

  private async getOptimizedCount(
    queryBuilder: SelectQueryBuilder<Company>,
    hasFilters: boolean,
  ): Promise<number> {
    if (hasFilters) {
      return await queryBuilder.getCount();
    }

    try {
      // result ကို string index ပါတဲ့ object array အဖြစ် type သတ်မှတ်ပေးပါ
      const result = await this.companyRepository.query<{ estimate: string }[]>(
        `SELECT reltuples::bigint AS estimate FROM pg_class c 
       JOIN pg_namespace n ON n.oid = c.relnamespace 
       WHERE n.nspname = 'public' AND c.relname = 'company'`,
      );

      // result[0] ရှိမရှိကို optional chaining (?.) နဲ့ စစ်ပါ
      const estimate =
        result && result.length > 0 ? Number(result[0].estimate) : 0;

      return estimate < 1000 ? await this.companyRepository.count() : estimate;
    } catch {
      return await this.companyRepository.count();
    }
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    file?: Express.Multer.File,
  ): Promise<Company> {
    const dto = { ...updateCompanyDto };

    if (Object.keys(dto).length === 0 && !file) {
      throw new Error('No data provided for update');
    }

    if (file) {
      const existingCompany = await this.findOne(id);

      const [optimizedFile] = await Promise.all([
        this.optimizeImageService.optimizeImage(file),
        existingCompany.image
          ? this.fileService.deleteFile(existingCompany.image)
          : Promise.resolve(),
      ]);

      dto.image = await this.fileService.uploadFile(optimizedFile, 'company');
    }

    return await this.opService.update<Company>(
      this.companyRepository,
      id,
      dto,
    );
  }

  async remove(id: string): Promise<Company> {
    const existingCompany = await this.findOne(id);
    if (existingCompany?.image) {
      await this.fileService.deleteFile(existingCompany.image);
    }
    return await this.opService.remove<Company>(this.companyRepository, id);
  }
}
