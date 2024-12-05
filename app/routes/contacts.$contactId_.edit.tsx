// データの更新
// $contactId_ の奇妙な _ に注目してください。デフォルトでは、ルートは同じプレフィックスを持つルートの中に自動的にネストされます。
// 末尾に _ を追加することで、ルートが app/routes/contacts.$contactId.tsx にネストされないように指示します。

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import invariant from "tiny-invariant";

import { getContact, updateContact } from "../data";

// `FormData` を使用して連絡先を更新する
// 作成した編集ルートはすでに form をレンダリングしています。
// 必要なのは action 関数を追加することだけです。
// Remix は form をシリアライズし、fetch で POST し、自動的にすべてのデータを再検証します。
export const action = async ({ request, params }: ActionFunctionArgs) => {
    invariant(params.contactId, "Missing contactId param");
    const formData = await request.formData();
    // const firstName = formData.get("first");
    // const lastName = formData.get("last");
    // フォームフィールドがいくつかあるため、Object.fromEntriesを使用してすべてのフィールドをオブジェクトに収集しました。
    // これは、updateContact関数が期待するものです。
    const updates = Object.fromEntries(formData);
    await updateContact(params.contactId, updates);
    return redirect(`/contacts/${params.contactId}`);
};

export const loader = async ({ params,}: LoaderFunctionArgs) => {
    invariant(params.contactId, "Missing contactId param");
    const contact = await getContact(params.contactId);
    if (!contact) {
        throw new Response("Not Found", { status: 404 });
    }
    return json({ contact });
};

export default function EditContact() {
    const { contact } = useLoaderData<typeof loader>();
    // キャンセルボタン
    // 編集ページには、まだ何も動作しないキャンセルボタンがあります。
    // ブラウザの戻るボタンと同じ動作にする必要があります。
    // これを行うには、useNavigate フックを使用します。
    const navigate = useNavigate();

    return (
        <Form key={contact.id} id="contact-form" method="post">
            <p>
                <span>名前</span>
                <input
                    aria-label="名"
                    defaultValue={contact.first}
                    name="first"
                    placeholder="名"
                    type="text"
                />
                <input
                    aria-label="姓"
                    defaultValue={contact.last}
                    name="last"
                    placeholder="姓"
                    type="text"
                />
            </p>
            <label>
                <span>Twitter</span>
                <input
                    defaultValue={contact.twitter}
                    name="twitter"
                    placeholder="@jack"
                    type="text"
                />
            </label>
            <label>
                <span>メモ</span>
                <textarea
                    defaultValue={contact.notes}
                    name="notes"
                    rows={6}
                />
            </label>
            <p>
                <button type="submit">保存</button>
                {/* これで、ユーザーが「キャンセル」をクリックすると、ブラウザの履歴で 1 つ前のエントリに戻されます。 */}
                <button onClick={() => navigate(-1)} type="reset">キャンセル</button>
            </p>
        </Form>
    );
}