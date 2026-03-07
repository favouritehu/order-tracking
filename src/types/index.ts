export interface Order {
    _RowNumber: string;
    'Unique Id': string;
    'Name': string;
    'Email': string;
    'Phone': string;
    'TOKEN AMOUNT': string;
    'COMPANY NAME': string;
    'GST NO. / ADHAR CARD NO': string;
    'Address': string;
    'PRUDUCT': string;
    'Roll Size-Gsm With Quantity Of Product': string;
    'COLOR': string;
    'Total Order Quantity in Kg': string;
    'EXTRA NOTE:': string;
    'Status': string;
    'Aprox Date': string;
    'Token Amount Confirmed': string;
    'Balance payment': string;
    'Invoice': string;
    'Roll List': string;
    'Bilty': string;
    'Driver No/Bilty No.': string;
    'Note': string;
    'PI': string;
    'order_date': string;
    'Sale_Name': string;
    'ORDER DESIGN': string;
    'Transport_Type': string;
    'Transporter_Name': string;
    'Billing_Type': string;
    'Delivery_Location': string;
    'Whatsapp': string;
    'Dispatch summarys': string;
    'Summary': string;
    'Order Comments': string;
    'Related Qcs': string;
    'Dispatch Date': string;
}
export interface Stats {
    totalOrders: number;
    loadingPoint: number;
    loadingDone: number;
    statusBreakdown: Record<string, number>;
}

export interface OrderSummary {
    total: number;
    statusBreakdown: Record<string, number>;
    parties: Record<string, number>;
    products: Record<string, number>;
    regions: Record<string, number>;
}

export interface QcRecord {
    _RowNumber: string;
    'Unique Id': string;
    'Order Id': string;
    'Party Name': string;
    'Date': string;
    'Loading By': string;
    'Tranasport Methode': string;
    'Core': string;
    'Packaging': string;
    'Counting': string;
    'Sticker': string;
    'No  Hook Sticker': string;
    'If Any Damage': string;
    'Net wt': string;
    'Gross wt': string;
    'Truck Wt': string;
    'Material Image (With Truck)': string;
    'Kata Parchi Image': string;
    'Qc By': string;
    'Audit': string;
    'Material Images_1': string;
    'Phone no': string;
    'Email': string;
}
