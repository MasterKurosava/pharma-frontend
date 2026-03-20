import type { Order, OrderItem, OrderUpdateDto } from "@/entities/order/api/order-types";
import type { OrderFormValues } from "@/features/orders/model/order-form-schema";

export function orderApiToFormValues(order: Order): OrderFormValues {
  const items = order.items?.length
    ? order.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }))
    : [{ productId: 0, quantity: 1 }];

  return {
    clientId: order.clientId ?? 0,
    countryId: order.countryId ?? 0,
    cityId: order.cityId ?? 0,
    address: order.address ?? "",

    deliveryCompanyId: order.deliveryCompanyId ?? 0,
    deliveryTypeId: order.deliveryTypeId ?? 0,
    deliveryPrice: order.deliveryPrice ?? 0,
    storagePlaceId: order.storagePlaceId ?? 0,

    paymentStatusId: order.paymentStatusId ?? 0,
    orderStatusId: order.orderStatusId ?? 0,
    assemblyStatusId: order.assemblyStatusId ?? 0,
    responsibleUserId: order.responsibleUserId ?? 0,

    paidAmount: order.paidAmount ?? 0,
    description: order.description ?? undefined,

    totalPrice: order.totalPrice ?? 0,
    remainingAmount: order.remainingAmount ?? 0,

    items,
  };
}

export function orderFormValuesToUpdateDto(values: OrderFormValues): OrderUpdateDto {
  const items: OrderItem[] = values.items.map((it) => ({
    productId: it.productId,
    quantity: it.quantity,
  }));

  return {
    clientId: values.clientId,
    countryId: values.countryId,
    cityId: values.cityId,
    address: values.address,

    deliveryCompanyId: values.deliveryCompanyId === 0 ? null : values.deliveryCompanyId,
    deliveryTypeId: values.deliveryTypeId === 0 ? null : values.deliveryTypeId,
    deliveryPrice: values.deliveryPrice ?? 0,
    storagePlaceId: values.storagePlaceId === 0 ? null : values.storagePlaceId,

    paymentStatusId: values.paymentStatusId,
    orderStatusId: values.orderStatusId,
    assemblyStatusId: values.assemblyStatusId === 0 ? null : values.assemblyStatusId,
    responsibleUserId: values.responsibleUserId === 0 ? null : values.responsibleUserId,

    description: values.description ?? undefined,
    paidAmount: values.paidAmount,
    items,
  };
}

