
const SPREADSHEET_ID = '1Z22RaAz1BUanswQGpjOfRFZRsvqA7ptzdLHQs--Si54';
const RANGE = 'Templify!A2:B'; // Assuming row 1 is headers

export interface SheetTemplate {
  name: string;
  content: string;
}

declare const google: any;

export const getAccessToken = (clientId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        callback: (response: any) => {
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to get access token: ' + (response.error || 'Unknown error')));
          }
        },
      });
      client.requestAccessToken();
    } catch (error) {
      reject(error);
    }
  });
};

export const fetchSheetTemplates = async (accessToken: string, spreadsheetId: string): Promise<SheetTemplate[]> => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${RANGE}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Sheets API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];
    
    return rows.map((row: string[]) => ({
      name: row[0] || 'Untitled Template',
      content: row[1] || '',
    })).filter((t: SheetTemplate) => t.content.length > 0);
  } catch (error) {
    console.error('Error fetching sheet templates:', error);
    throw error;
  }
};
