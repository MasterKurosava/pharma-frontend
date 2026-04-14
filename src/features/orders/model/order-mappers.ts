import type { Order, OrderCreateDto, OrderUpdateDto } from "@/entities/order/api/order-types";
import type { OrderFormValues } from "@/features/orders/model/order-form-schema";
import { PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";
import { ORDER_DEFAULT_CODES } from "@/features/orders/config/orders-ui-config";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function orderApiToFormValues(order: Order): OrderFormValues {
  return {
    clientPhone: order.clientPhone ?? "",
    clientFullName: order.clientFullName ?? "",
    city: order.city ?? undefined,
    address: order.address ?? undefined,

    actionStatusCode: (order.actionStatusCode ?? ORDER_DEFAULT_CODES.actionStatusCode) as OrderFormValues["actionStatusCode"],
    stateStatusCode: (order.stateStatusCode ?? ORDER_DEFAULT_CODES.stateStatusCode) as OrderFormValues["stateStatusCode"],
    assemblyStatusCode: order.assemblyStatusCode ?? undefined,
    paymentStatus: (order.paymentStatus ?? PAYMENT_STATUS_OPTIONS[0].value) as OrderFormValues["paymentStatus"],
    deliveryPrice: toNumber(order.deliveryPrice, 0),
    storagePlaceId: toNumber(order.storagePlaceId, 0),
    orderStorage: order.orderStorage ?? undefined,

    description: order.description ?? undefined,
    productId: toNumber(order.productId, 0),
    quantity: toNumber(order.quantity, 1),
    productPrice: toNumber(order.productPrice, 0),
    totalPrice: toNumber(order.totalPrice, 0),
    remainingAmount: toNumber(order.remainingAmount, 0),
  };
}

export function orderFormValuesToUpdateDto(values: OrderFormValues): OrderUpdateDto {
  return {
    clientPhone: values.clientPhone,
    clientFullName: values.clientFullName?.trim() || undefined,
    city: values.city?.trim() || undefined,
    address: values.address?.trim() || undefined,
    actionStatusCode: values.actionStatusCode as OrderUpdateDto["actionStatusCode"],
    stateStatusCode: values.stateStatusCode as OrderUpdateDto["stateStatusCode"],
    assemblyStatusCode: values.assemblyStatusCode?.trim() || undefined,
    paymentStatus: values.paymentStatus as OrderUpdateDto["paymentStatus"],
    deliveryPrice: values.deliveryPrice,
    storagePlaceId: values.storagePlaceId === 0 ? undefined : values.storagePlaceId,
    orderStorage: values.orderStorage?.trim() || undefined,
    description: values.description?.trim() || undefined,
    productId: values.productId,
    quantity: values.quantity,
    productPrice: values.productPrice,
  };
}

export function orderFormValuesToCreateDto(values: OrderFormValues): OrderCreateDto {
  const base = orderFormValuesToUpdateDto(values);
  return {
    clientPhone: values.clientPhone,
    clientFullName: values.clientFullName?.trim() || undefined,
    city: values.city?.trim() || undefined,
    address: values.address?.trim() || undefined,
    actionStatusCode: values.actionStatusCode as OrderCreateDto["actionStatusCode"],
    stateStatusCode: values.stateStatusCode as OrderCreateDto["stateStatusCode"],
    paymentStatus: values.paymentStatus as OrderCreateDto["paymentStatus"],
    deliveryPrice: values.deliveryPrice,
    storagePlaceId: base.storagePlaceId === null ? undefined : base.storagePlaceId,
    orderStorage: values.orderStorage?.trim() || undefined,
    description: values.description,
    productId: values.productId,
    quantity: values.quantity,
    productPrice: values.productPrice,
  };
}

