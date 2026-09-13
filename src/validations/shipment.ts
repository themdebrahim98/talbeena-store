import { z } from "zod";

export const COURIER_PARTNERS = [
  { id: "Delhivery", name: "Delhivery", urlPrefix: "https://www.delhivery.com/track/package/" },
  { id: "Blue Dart", name: "Blue Dart", urlPrefix: "https://www.bluedart.com/tracking?trackFor=" },
  { id: "DTDC", name: "DTDC", urlPrefix: "https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=" },
  { id: "India Post", name: "India Post", urlPrefix: "https://www.indiapost.gov.in/_layouts/15/dpt.cpt.tracking/tracking.aspx" },
  { id: "Shadowfax", name: "Shadowfax", urlPrefix: "https://tracker.shadowfax.in/#/track?awb=" },
  { id: "Xpressbees", name: "Xpressbees", urlPrefix: "https://www.xpressbees.com/track?awbNo=" },
  { id: "Other", name: "Other Courier", urlPrefix: "" },
] as const;

export const shipmentSchema = z.object({
  carrier: z.string().trim().min(2, "Please select or enter a courier name."),
  trackingNumber: z.string().trim().min(4, "Please enter a valid tracking/AWB number."),
  trackingUrl: z.string().trim().optional().nullable(),
  estimatedDeliveryDays: z.coerce.number().int().min(1).max(30).optional().default(3),
});

export type ShipmentInput = z.input<typeof shipmentSchema>;
