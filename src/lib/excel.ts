import ExcelJS from 'exceljs';
import type { NewsletterSubscriber } from './sheets';

/**
 * Export newsletter subscribers to Excel file
 * @param subscribers - Array of newsletter subscribers
 * @returns Buffer containing the Excel file
 */
export const exportSubscribersToExcel = async (
    subscribers: NewsletterSubscriber[]
): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Abonnés Newsletter');

    // Define columns
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Prénom', key: 'firstName', width: 20 },
        { header: 'Nom', key: 'lastName', width: 20 },
        { header: 'Date d\'inscription', key: 'subscribedAt', width: 20 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Source', key: 'source', width: 20 },
        { header: 'Tags', key: 'tags', width: 30 },
        { header: 'Dernière campagne', key: 'lastCampaignSent', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4AF37' }, // Gold color
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    subscribers.forEach(subscriber => {
        worksheet.addRow({
            id: subscriber.id,
            email: subscriber.email,
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
            subscribedAt: subscriber.subscribedAt,
            status: subscriber.status,
            source: subscriber.source,
            tags: subscriber.tags,
            lastCampaignSent: subscriber.lastCampaignSent,
        });
    });

    // Auto-filter
    worksheet.autoFilter = {
        from: 'A1',
        to: 'I1',
    };

    // Freeze header row
    worksheet.views = [
        { state: 'frozen', ySplit: 1 }
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

/**
 * Generate filename for export
 */
export const generateExportFilename = (): string => {
    const date = new Date().toISOString().split('T')[0];
    return `newsletter-subscribers-${date}.xlsx`;
};
