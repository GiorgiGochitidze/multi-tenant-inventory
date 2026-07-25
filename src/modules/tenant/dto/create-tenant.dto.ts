import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTenantDto {
  /**
   * Company or shop name
   * @example "Acme Superstore"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  /**
   * Optional custom URL slug (auto-generated from name if omitted)
   * @example "acme-superstore"
   */
  @IsString()
  @IsOptional()
  slug?: string;
}
