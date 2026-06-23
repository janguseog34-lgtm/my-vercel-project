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

const requestOptions = [
  { label: "선택 안 함", value: "" },
  "문 앞에 놓아주세요",
  "도착하면 전화주세요",
  "벨은 누르지 말아주세요",
  "수저/포크는 빼주세요",
  "일회용품을 챙겨주세요",
  "소스는 따로 담아주세요",
].map((option) =>
  typeof option === "string" ? { label: option, value: option } : option,
);

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
            className="text-sm font-bold text-[var(--foreground)]"
            htmlFor="recipientName"
          >
            수령인
          </label>
          <input
            autoComplete="name"
            className="form-input mt-2"
            defaultValue={values.recipientName}
            id="recipientName"
            name="recipientName"
            required
            type="text"
          />
        </div>

        <div>
          <label
            className="text-sm font-bold text-[var(--foreground)]"
            htmlFor="phone"
          >
            전화번호
          </label>
          <input
            autoComplete="tel"
            className="form-input mt-2"
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
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="addressLine1"
        >
          주소
        </label>
        <input
          autoComplete="street-address"
          className="form-input mt-2"
          defaultValue={values.addressLine1}
          id="addressLine1"
          name="addressLine1"
          placeholder="도로명 주소 또는 지번 주소"
          required
          type="text"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_190px]">
        <div>
          <label
            className="text-sm font-bold text-[var(--foreground)]"
            htmlFor="addressLine2"
          >
            상세주소
          </label>
          <input
            autoComplete="address-line2"
            className="form-input mt-2"
            defaultValue={values.addressLine2}
            id="addressLine2"
            name="addressLine2"
            placeholder="동, 호수 등"
            type="text"
          />
        </div>

        <div>
          <label
            className="text-sm font-bold text-[var(--foreground)]"
            htmlFor="paymentMethod"
          >
            결제 방법
          </label>
          <select
            className="form-select mt-2"
            defaultValue={values.paymentMethod ?? "CARD"}
            id="paymentMethod"
            name="paymentMethod"
          >
            <option value="CARD">카드 결제</option>
            <option value="CASH">현금 결제</option>
            <option value="MOCK">앱 테스트 결제</option>
          </select>
        </div>
      </div>

      <div>
        <label
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="requestOption"
        >
          요청사항 <span className="font-semibold text-[var(--muted)]">(선택)</span>
        </label>
        <select
          className="form-select mt-2"
          defaultValue={values.requestOption ?? ""}
          id="requestOption"
          name="requestOption"
        >
          {requestOptions.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="text-sm font-bold text-[var(--foreground)]"
          htmlFor="customMemo"
        >
          기타사항 <span className="font-semibold text-[var(--muted)]">(직접 입력)</span>
        </label>
        <textarea
          className="form-textarea mt-2"
          defaultValue={values.customMemo}
          id="customMemo"
          name="customMemo"
          placeholder="예: 아이가 자고 있어서 조용히 부탁드려요."
        />
      </div>

      {state.error ? (
        <p className="notice-danger">{state.error}</p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          className="button-secondary h-11"
          href="/"
        >
          장바구니로 돌아가기
        </Link>
        <button
          className="button-primary h-11"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "주문 저장 중" : "배송지와 결제 방법 확인 후 주문하기"}
        </button>
      </div>
    </form>
  );
}
