/**
 * U.B (Under Billing) Record Type
 * Matches the AppSheet U.B table structure (70 columns)
 */

export interface UbRecord {
    _RowNumber: string;
    'Row ID': string;
    'Added Time': string;
    'Discount': string;
    'Unique ID': string;
    'Date': string;
    'ORDER ID': string;
    'Invoice No.': string;
    'Party Name': string;
    'Advance Amount': string;
    'Outstanding Amount': string;
    'Fright': string;
    'Fright Inc Gst': string;

    // Product 1
    '1.Product Name': string;
    '1.Quantity': string;
    '1.U.B RATE': string;
    '1.A.VALUE RATE': string;
    '1.GST': string;
    '1.INV AMT': string;
    '1.Under Billing Amt': string;
    '1.Total Pay Amount': string;

    // Product 2
    '2.Product Name': string;
    '2.Quantity': string;
    '2.U.B RATE': string;
    '2.A.VALUE RATE': string;
    '2.GST': string;
    '2.INV AMT': string;
    '2.Under Billing Amt': string;
    '2.Total Pay Amount': string;

    // Product 3
    '3.Product Name': string;
    '3.Quantity': string;
    '3.U.B RATE': string;
    '3.A.VALUE RATE': string;
    '3.GST': string;
    '3.INV AMT': string;
    '3.Under Billing Amt': string;
    '3.Total Pay Amount': string;

    // Product 4
    '4.Product Name': string;
    '4.Quantity': string;
    '4.U.B RATE': string;
    '4.A.VALUE RATE': string;
    '4.GST': string;
    '4.INV AMT': string;
    '4.Under Billing Amt': string;
    '4.Total Pay Amount': string;

    // Product 5
    '5.Product Name': string;
    '5.Quantity': string;
    '5.U.B RATE': string;
    '5.A.VALUE RATE': string;
    '5.GST': string;
    '5.INV AMT': string;
    '5.Under Billing Amt': string;
    '5.Total Pay Amount': string;

    // Totals
    'To Pay Amount': string;
    'Order Narretion': string;
    'Book Balance': string;
    'Cash Balance': string;
    'Approval': string;
    'UNIT': string;
    'GST': string;
    'Additional Amounts': string;
    'Invamt': string;
    'Camt': string;
    'TOTAL INVOICE AMT': string;
    'TOTAL U.B AMOUNT': string;
    'GRAND TOTAL AMOUNT': string;
    'Summary file': string;
    'Total Wt In Kg': string;
    'File Link': string;
    '_ComputedKey': string;
}

/** Helper to extract non-empty product line items from a U.B record */
export interface UbProductLine {
    index: number;
    name: string;
    quantity: string;
    ubRate: string;
    avRate: string;
    gst: string;
    invAmt: string;
    ubAmt: string;
    totalPay: string;
}

export function getProductLines(record: UbRecord): UbProductLine[] {
    const lines: UbProductLine[] = [];
    for (let i = 1; i <= 5; i++) {
        const name = record[`${i}.Product Name` as keyof UbRecord];
        if (name && name.trim()) {
            lines.push({
                index: i,
                name,
                quantity: record[`${i}.Quantity` as keyof UbRecord] || '',
                ubRate: record[`${i}.U.B RATE` as keyof UbRecord] || '',
                avRate: record[`${i}.A.VALUE RATE` as keyof UbRecord] || '',
                gst: record[`${i}.GST` as keyof UbRecord] || '',
                invAmt: record[`${i}.INV AMT` as keyof UbRecord] || '',
                ubAmt: record[`${i}.Under Billing Amt` as keyof UbRecord] || '',
                totalPay: record[`${i}.Total Pay Amount` as keyof UbRecord] || '',
            });
        }
    }
    return lines;
}
