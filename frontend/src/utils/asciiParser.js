/**
 * Parses the raw ASCII text table returned by the backend's GET /post endpoint
 * into an array of structured JSON objects.
 * 
 * Example raw data format:
 * | STT   |   Amount   |       Title |               Description |        Tag |
 * | ----- | ---------- | -------------------- | ---------------------------------------- | -------------------- |
 * |  1    |       1000 | Lunch                | Lunch at KFC                             | Food                 |
 * | ----- | ---------- | -------------------- | ---------------------------------------- | -------------------- |
 * |  Sum  | 1000       |                      |                                          |                      |
 * | ----- | ---------- | -------------------- | ---------------------------------------- | -------------------- |
 * 
 * @param {string} rawText The plain text response from the API
 * @returns {Array<{stt: number, amount: number, title: string, description: string, tag: string}>} Array of expense objects
 */
export function parseAsciiExpenses(rawText) {
  if (!rawText) {
    return [];
  }

  // If Axios automatically parsed the JSON response into an array
  if (Array.isArray(rawText)) {
    return rawText;
  }

  // If rawText is a JSON string representing an array of objects
  if (typeof rawText === 'string') {
    const trimmed = rawText.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse response JSON:', e);
      }
    }
  }

  if (typeof rawText !== 'string') {
    return [];
  }

  const trimmedText = rawText.trim();
  if (trimmedText === "Have no expense" || trimmedText === "") {
    return [];
  }

  const lines = trimmedText.split('\n');
  const expenses = [];

  for (let line of lines) {
    line = line.trim();
    // Validate line format (must be wrapped inside |...|)
    if (!line.startsWith('|') || !line.endsWith('|')) {
      continue;
    }

    // Split line by '|'
    const parts = line.split('|').map(part => part.trim());

    // An empty line split will look like: ["", "col1", "col2", "col3", "col4", "col5", "col6", "col7", "col8", ""]
    // It must have at least 10 parts (first and last are empty strings due to outer pipes)
    if (parts.length < 9) {
      continue;
    }

    const sttRaw = parts[1];
    const amountRaw = parts[2];
    const type = parts[3];
    const title = parts[4];
    const description = parts[5];
    const tag = parts[6];
    const createdAt = parts[7];
    const updatedAt = parts[8];

    // Filter out table headers, dividers, and summaries
    if (
      sttRaw.toLowerCase().includes('stt') || 
      sttRaw.includes('---') || 
      sttRaw.toLowerCase().includes('sum') ||
      !sttRaw
    ) {
      continue;
    }

    const stt = parseInt(sttRaw, 10);
    const amount = parseInt(amountRaw, 10);

    // If STT is not a number, skip this row
    if (isNaN(stt)) {
      continue;
    }

    expenses.push({
      stt,
      amount: isNaN(amount) ? 0 : amount,
      type: type || 'EXPENSE',
      title: title || '',
      description: description || '',
      tag: tag || 'Other',
      createdAt: createdAt || '',
      updatedAt: updatedAt || ''
    });
  }

  return expenses;
}
