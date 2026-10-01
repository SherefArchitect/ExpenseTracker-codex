import { z } from 'zod';

// Match .NET Char.IsWhiteSpace and dbo.ufn_Category_Trim, not JS native trim.
// Native trim excludes U+0085 and includes U+FEFF, unlike our shared policy.
const boundaryWhitespace =
  /^[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+|[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+$/g;
export const trimName = (value: string) =>
  value.replace(boundaryWhitespace, '');
const name = z
  .string()
  .transform(trimName)
  .pipe(
    z
      .string()
      .min(1, 'category.name.invalid')
      .max(100, 'category.name.invalid'),
  );
export const categoryNamesSchema = z.object({ nameEn: name, nameAr: name });
