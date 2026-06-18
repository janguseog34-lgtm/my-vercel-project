"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  placeOrderAction,
  type PlaceOrderFormState,
} from "@/server/actions/order.actions";

type CheckoutFormProps = {
  defaultValues: NonNullable<PlaceOrderFormState["values"]>;
};

const initialState: PlaceOrderFormState = {};

export function CheckoutForm({ defaultValues }: CheckoutFormProps) {
  const [state, formAction, isPending] = useActionState(
    placeOrderAction,
    initialState,
  );
  const values = {
    ...defaultValues,
    ...state.values,
  };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="text-sm font-semibold text-[#3f453c]"
            htmlFor="recipientName"
          >
            수령인
          </label>
          <input
            autoComplete="name"
            className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
            defaultValue={values.recipientName}
            id="recipientName"
            name="recipientName"
            required
            type="text"
          />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-[#3f453c]"
            htmlFor="phone"
          >
            전화번호
          </label>
          <input
            autoComplete="tel"
            className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
            defaultValue={values.phone}
            id="phone"
            name="phone"
            required
            type="tel"
          />
        </div>
      </div>

      <div>
        <label
          className="text-sm font-semibold text-[#3f453c]"
          htmlFor="addressLine1"
        >
          주소
        </label>
        <input
          autoComplete="street-address"
          className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
          defaultValue={values.addressLine1}
          id="addressLine1"
          name="addressLine1"
          placeholder="도로명 주소 또는 지번 주소"
          required
          type="text"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <div>
          <label
            className="text-sm font-semibold text-[#3f453c]"
            htmlFor="addressLine2"
          >
            상세주소
          </label>
          <input
            autoComplete="address-line2"
            className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
            defaultValue={values.addressLine2}
            id="addressLine2"
            name="addressLine2"
            placeholder="동, 호수 등"
            type="text"
          />
        </div>

        <div>
          <label
            className="text-sm font-semibold text-[#3f453c]"
            htmlFor="postalCode"
          >
            우편번호
          </label>
          <input
            autoComplete="postal-code"
            className="mt-2 h-11 w-full rounded-md border border-[#d8d6ca] bg-white px-3 text-sm outline-none focus:border-[#8d9b7f]"
            defaultValue={values.postalCode}
            id="postalCode"
            name="postalCode"
            type="text"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-[#3f453c]" htmlFor="memo">
          요청사항
        </label>
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-[#d8d6ca] bg-white px-3 py-3 text-sm outline-none focus:border-[#8d9b7f]"
          defaultValue={values.memo}
          id="memo"
          name="memo"
          placeholder="문 앞에 놓아주세요."
        />
      </div>

      {state.error ? (
        <p className="rounded-md bg-[#fff1ef] px-3 py-2 text-sm text-[#a53622]">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border border-[#c9c7ba] px-4 text-sm font-semibold transition hover:bg-[#f0eee4]"
          href="/"
        >
          장바구니로 돌아가기
        </Link>
        <button
          className="h-11 rounded-md bg-[#20251f] px-5 text-sm font-semibold text-white transition hover:bg-[#3c4537] disabled:cursor-not-allowed disabled:bg-[#9aa196]"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "주문 저장 중" : "주소 입력 완료 후 주문하기"}
        </button>
      </div>
    </form>
  );
}
