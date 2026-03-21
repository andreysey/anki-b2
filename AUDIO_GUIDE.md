# AwesomeTTS Guide (English & Ukrainian)

## [English] Guide: Adding Audio to Anki using AwesomeTTS

This guide will help you automatically add German pronunciation for words and example sentences in your Anki decks.

### 1. Installing AwesomeTTS

1. Open Anki.
2. Go to **Tools -> Add-ons**.
3. Click **Get Add-ons...**.
4. Enter code: `814349176` (AwesomeTTS).
5. Click **OK**, then restart Anki.

### 2. Card Setup

AwesomeTTS works best if you have a dedicated field for audio.

1. Go to **Tools -> Manage Note Types**.
2. Select the note type you are using (e.g., `Basic`).
3. Click **Fields...**.
4. Add a new field named `Audio`.

### 3. Generating Audio (Batch Processing)

1. Open the **Browse** window (press `B`).
2. Select your deck (e.g., `B2_IT_Vocab`).
3. Select all cards (`Ctrl + A`).
4. Go to **AwesomeTTS -> Add Audio to Selected...**.
5. In the window that appears:
   *   **Generator**: Choose a free service like `Google Translate` or `Microsoft Azure`.
   *   **Voice**: Select a German voice (e.g., `German (Germany)`).
   *   **Source Field**: The field containing the German word (usually `German`).
   *   **Destination Field**: The `Audio` field.
6. Click **Generate**.