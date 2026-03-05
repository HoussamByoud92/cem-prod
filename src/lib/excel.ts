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
    return buffer as Buffer;
};

export async function exportCatalogDemandsToExcel(demands: any[]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Demandes Catalogue');

    // Define columns
    sheet.columns = [
        { header: 'Nom', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Téléphone', key: 'phone', width: 20 },
        { header: 'Entreprise', key: 'company', width: 25 },
        { header: 'Fonction', key: 'role', width: 25 },
        { header: 'Source', key: 'source', width: 20 },
        { header: 'Date de Demande', key: 'requestedAt', width: 30 },
    ];

    // Style headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    demands.forEach(demand => {
        sheet.addRow({
            name: demand.name,
            email: demand.email,
            phone: demand.phone || '',
            company: demand.company || '',
            role: demand.role || '',
            source: demand.source || '',
            requestedAt: demand.requestedAt ? new Date(demand.requestedAt).toLocaleString('fr-FR') : '',
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
};

/**
 * Generate filename for export
 */
export const generateExportFilename = (): string => {
    const date = new Date().toISOString().split('T')[0];
    return `newsletter-subscribers-${date}.xlsx`;
};
