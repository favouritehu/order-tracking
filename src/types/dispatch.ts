export interface DispatchSummaryRecord {
    _RowNumber?: string;
    'Unique ID': string;
    'Order Id': string;
    'Date': string;
    'Added Time'?: string;
    'Invoice No.': string;
    'Vehical No': string;
    'Buyer': string;
    'Consignee': string;
    '1.No.of Rolls': string;
    '1.Des.Of Goods'?: string;
    '1.Color'?: string;
    '1.Qty': string;
    '1.size'?: string;
    '1.Gsm'?: string;
    '2.No.of Rolls': string;
    '2.Des.Of Goods'?: string;
    '2.Color'?: string;
    '2.Qty': string;
    '2.size'?: string;
    '2.Gsm'?: string;
    '3.No.of Rolls': string;
    '3.Des.Of Goods'?: string;
    '3.Color'?: string;
    '3.Qty': string;
    '3.size'?: string;
    '3.Gsm'?: string;
    '4.No.of Rolls': string;
    '4.Des.Of Goods'?: string;
    '4.Color'?: string;
    '4.Qty': string;
    '4.size'?: string;
    '4.Gsm'?: string;
    '5.No.of Rolls': string;
    '5.Des.Of Goods'?: string;
    '5.Color'?: string;
    '5.Qty': string;
    '5.size'?: string;
    '5.Gsm'?: string;
    '6.No.of Rolls': string;
    '6.Des.Of Goods'?: string;
    '6.Color'?: string;
    '6.Qty': string;
    '6.size'?: string;
    '6.Gsm'?: string;
    'Total Roll': string;
    'Total Wt': string;
    'Driver/Transport No.'?: string;
    'TRUCK REPORT DATE'?: string;
    'TRUCK RELEASED DATE'?: string;
    'Email'?: string;
    'Phone'?: string;
}

export interface DispatchItem {
    noOfRolls: string;
    desOfGoods: string;
    color: string;
    qty: string;
    size: string;
    gsm: string;
}

export function getDispatchItems(record: DispatchSummaryRecord): DispatchItem[] {
    const items: DispatchItem[] = [];
    for (let i = 1; i <= 6; i++) {
        const noOfRolls = record[`${i}.No.of Rolls` as keyof DispatchSummaryRecord] as string;
        const qty = record[`${i}.Qty` as keyof DispatchSummaryRecord] as string;
        const desOfGoods = (record[`${i}.Des.Of Goods` as keyof DispatchSummaryRecord] as string) || '';
        const color = (record[`${i}.Color` as keyof DispatchSummaryRecord] as string) || '';
        const size = (record[`${i}.size` as keyof DispatchSummaryRecord] as string) || '';
        const gsm = (record[`${i}.Gsm` as keyof DispatchSummaryRecord] as string) || '';

        if (noOfRolls || qty) {
            items.push({ noOfRolls: noOfRolls || '', desOfGoods, color, qty: qty || '', size, gsm });
        }
    }
    return items;
}
