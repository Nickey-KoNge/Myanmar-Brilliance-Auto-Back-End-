// src/modules/master-company/company/master-company.company.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MasterCompanyCompanyService } from './master-company.company.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { PaginateCompaniesDto } from './dtos/paginate-companies.dto';
import { FindCompaniesSerialize } from './serialize/find-companies.serialize';
import { GetCompanySerialize } from './serialize/get-companies.serialize';
import { plainToInstance } from 'class-transformer';

@Controller('master-company/company')
export class MasterCompanyCompanyController {
  constructor(
    private readonly masterCompanyCompanyService: MasterCompanyCompanyService,
  ) {}
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async findAll(@Query() query: PaginateCompaniesDto) {
    const result = await this.masterCompanyCompanyService.findAll(query);
    const serializedData = plainToInstance(
      FindCompaniesSerialize,
      result.data,
      {
        excludeExtraneousValues: true,
      },
    );
    return {
      ...result,
      data: serializedData,
    };
  }
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.masterCompanyCompanyService.create(createCompanyDto, file);
  }
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const company = await this.masterCompanyCompanyService.findOne(id);
    return plainToInstance(GetCompanySerialize, company, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.masterCompanyCompanyService.update(id, updateCompanyDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.masterCompanyCompanyService.remove(id);
  }
}
