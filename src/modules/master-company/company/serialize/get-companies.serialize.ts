// src/modules/master-company/company/serialize/get-companies.serialize.ts

import { Expose, Transform, Type } from 'class-transformer';

export class GetCompanySerialize {
  @Expose()
  id: string;

  @Expose()
  company_name: string;

  @Expose()
  reg_number: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  website_url: string;

  @Expose()
  image: string;

  @Expose()
  street_address: string;

  @Expose()
  city: string;

  @Expose()
  country: string;

  // Address တစ်ခုလုံးကို ပေါင်းပြချင်ရင်
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
  @Type(() => Date)
  establish_year: Date;

  @Expose()
  @Type(() => Date)
  reg_exp_date: Date;

  @Expose()
  status: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
