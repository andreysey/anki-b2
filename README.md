# Anki B2 German (German-English-Ukrainian)

This repository contains thematic vocabulary files for Anki, covering B2 level German with English and Ukrainian translations, including example sentences.

## File Format
All files (`.txt`) are standardized using the following 4-field semicolon-separated format:
`German ; English ; Ukrainian ; Example`

### Import Headers
Each file includes Anki-specific headers for automatic configuration:
- `#separator:;`
- `#html:true`
- `#columns:German;English;Ukrainian;Example`

## How to Import into Anki

1. **Note Type Requirements**: Ensure your Anki Note Type has at least **4 fields** (e.g., *German, English, Ukrainian, Example*).
2. **Import**: Select `File` -> `Import` in Anki and choose one of the `.txt` files.
3. **Field Mapping**: Anki should automatically detect the headers and map the columns to your fields. If not, manually map them:
   - Column 1 -> German
   - Column 2 -> English
   - Column 3 -> Ukrainian
   - Column 4 -> Example sentence
4. **Card Template**: Update your Card Template in Anki to display the newly added `{{Ukrainian}}` and `{{Example}}` fields.

---

# Anki B2 German (Німецька-Англійська-Українська)

Цей репозиторій містить тематичні файли словника для Anki (рівень B2) з перекладом на англійську та українську мови, включаючи приклади речень.

## Формат файлів
Усі файли (`.txt`) стандартизовані за допомогою формату з 4 полями, розділеними крапкою з комою:
`German ; English ; Ukrainian ; Example`

## Як імпортувати в Anki

1. **Тип нотатки**: Переконайтеся, що ваш тип нотатки в Anki має принаймні **4 поля** (наприклад: *German, English, Ukrainian, Example*).
2. **Імпорт**: Виберіть `File` -> `Import` в Anki та виберіть потрібний `.txt` файл.
3. **Налаштування**: Anki має автоматично розпізнати заголовки. Якщо ні, налаштуйте відповідність колонок полям вручну.
4. **Шаблон картки**: Оновіть шаблон вашої картки в Anki, щоб відобразити нові поля `{{Ukrainian}}` та `{{Example}}`.
