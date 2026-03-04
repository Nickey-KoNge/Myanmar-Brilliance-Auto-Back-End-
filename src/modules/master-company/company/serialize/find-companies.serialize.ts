// src/modules/master-company/company/serialize/find-companies.serialize.ts
import { Expose, Transform, Type } from 'class-transformer';
export class FindCompaniesSerialize {
  @Expose()
  id: string;

  @Expose()
  company_name: string;

  @Expose()
  reg_number: string;

  @Expose()
  phone: string;

  @Expose()
  @Transform(({ obj }) => {
    const data = obj as Record<string, any>;
    return `${data.street_address || ''} ${data.city || ''} ${data.country || ''}`.trim();
  })
  fullAddress: string;

  @Expose()
  owner_name: string;

  @Expose()
  owner_email: string;

  @Expose()
  owner_phone: string;

  @Expose()
  website_url: string;

  @Expose()
  @Type(() => Date)
  establish_year: Date;

  @Expose()
  @Type(() => Date)
  reg_exp_date: Date;

  @Expose()
  email: string;

  @Expose()
  image: string;
}
