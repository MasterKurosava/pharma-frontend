import type { Order, OrderCreateDto, OrderItem, OrderUpdateDto } from "@/entities/order/api/order-types";
import type { OrderFormValues } from "@/features/orders/model/order-form-schema";
import { DELIVERY_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function orderApiToFormValues(order: Order): OrderFormValues {
  const items = order.items?.length
    ? order.items.map((it) => ({
        productId: toNumber(it.productId, 0),
        quantity: toNumber(it.quantity, 1),
      }))
    : [{ productId: 0, quantity: 1 }];

  return {
    clientPhone: order.clientPhone ?? "",
    countryId: toNumber(order.countryId, 0),
    city: order.city ?? "",
    address: order.address ?? "",

    deliveryStatus: (order.deliveryStatus ?? DELIVERY_STATUS_OPTIONS[0].value) as OrderFormValues["deliveryStatus"],
    deliveryPrice: toNumber(order.deliveryPrice, 0),
    storagePlaceId: toNumber(order.storagePlaceId, 0),

    paymentStatus: (order.paymentStatus ?? PAYMENT_STATUS_OPTIONS[0].value) as OrderFormValues["paymentStatus"],
    orderStatus: (order.orderStatus ?? ORDER_STATUS_OPTIONS[0].value) as OrderFormValues["orderStatus"],

    paidAmount: toNumber(order.paidAmount, 0),
    description: order.description ?? undefined,

    totalPrice: toNumber(order.totalPrice, 0),
    remainingAmount: toNumber(order.remainingAmount, 0),

    items,
  };
}

export function orderFormValuesToUpdateDto(values: OrderFormValues): OrderUpdateDto {
  const items: OrderItem[] = values.items.map((it) => ({
    productId: it.productId,
    quantity: it.quantity,
  }));

  return {
    clientPhone: values.clientPhone,
    countryId: values.countryId,
    city: values.city,
    address: values.address,

    deliveryStatus: values.deliveryStatus as OrderUpdateDto["deliveryStatus"],
    deliveryPrice: values.deliveryPrice ?? 0,
    storagePlaceId: values.storagePlaceId === 0 ? null : values.storagePlaceId,

    paymentStatus: values.paymentStatus as OrderUpdateDto["paymentStatus"],
    orderStatus: values.orderStatus as OrderUpdateDto["orderStatus"],

    description: values.description ?? undefined,
    paidAmount: values.paidAmount,
    items,
  };
}

export function orderFormValuesToCreateDto(values: OrderFormValues): OrderCreateDto {
  const base = orderFormValuesToUpdateDto(values);
  return {
    clientPhone: values.clientPhone,
    countryId: values.countryId,
    city: values.city,
    address: values.address,
    deliveryStatus: values.deliveryStatus as OrderCreateDto["deliveryStatus"],
    deliveryPrice: values.deliveryPrice ?? 0,
    paymentStatus: values.paymentStatus as OrderCreateDto["paymentStatus"],
    orderStatus: values.orderStatus as OrderCreateDto["orderStatus"],
    storagePlaceId: base.storagePlaceId === null ? undefined : base.storagePlaceId,
    description: values.description ?? undefined,
    paidAmount: values.paidAmount,
    items: base.items ?? [],
  };
}

