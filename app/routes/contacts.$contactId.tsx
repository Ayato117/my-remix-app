// Remix の ルートファイル規則 において、
// ` . ` は URL に` / ` を作成し、` $ ` はセグメントを動的にします。 

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import type { FunctionComponent } from "react";
import type { ContactRecord } from "../data";
import { getContact, updateContact } from "../data";
import invariant from "tiny-invariant";

// フェッチャーフォームは、ナビゲーションを引き起こすことはなく、単に action にフェッチします。
export const action = async ({
    params,
    request,
  }: ActionFunctionArgs) => {
    invariant(params.contactId, "Missing contactId param");
    const formData = await request.formData();
    return updateContact(params.contactId, {
      favorite: formData.get("favorite") === "true",
    });
  };

export const loader = async ({ params, }: LoaderFunctionArgs) => {
    // Invariant は、コードで潜在的な問題が発生した場合にカスタムメッセージ付きでエラーをスローするのに便利な関数です。
    invariant(params.contactId, "Missing contactId param");
    const contact = await getContact(params.contactId);
    // 404 エラーを返す
    // ユーザーが見つからない場合、このパスでのコード実行は停止し、代わりに Remix はエラーパスをレンダリングします。
    if (!contact) {
        throw new Response("Not Found", { status: 404 });
    }
    return json({ contact });
};

export default function Contact() {
    // ローダーにおける URL パラメータ
    const { contact } = useLoaderData<typeof loader>();

    // const contact = {
    //     first: "Your",
    //     last: "Name",
    //     avatar: "https://placecats.com/300/200",
    //     twitter: "your-handle",
    //     notes: "Some notes",
    //     favorite: true,
    // };

    return (
        <div id="contact">
            <div>
                <img
                    alt={`${contact.first} ${contact.last} avatar`}
                    key={contact.avatar}
                    src={contact.avatar}
                />
            </div>

            <div>
                <h1>
                    {contact.first || contact.last ? (
                        <>
                            {contact.first} {contact.last}
                        </>
                    ) : (
                        <i>No Name</i>
                    )}{" "}
                    <Favorite contact={contact} />
                </h1>

                {contact.twitter ? (
                    <p>
                        <a
                            href={`https://twitter.com/${contact.twitter}`}
                        >
                            {contact.twitter}
                        </a>
                    </p>
                ) : null}

                {contact.notes ? <p>{contact.notes}</p> : null}

                <div>
                    <Form action="edit">
                        <button type="submit">編集</button>
                    </Form>

                    {/* <Form> はサーバーへの新しいドキュメント POST リクエストを送信するというデフォルトのブラウザの動作を阻止しますが、
                        代わりにクライアントサイドルーティングと fetch を使用して、ブラウザをエミュレートし、POST リクエストを作成します。 */}
                    <Form
                        // <Form action="destroy"> は "contacts.$contactId.destroy" の新しいルートに一致し、リクエストを送信します。
                        action="destroy"
                        method="post"
                        onSubmit={(event) => {
                            const response = confirm(
                                "このレコードを削除しますか？"
                            );
                            if (!response) {
                                event.preventDefault();
                            }
                        }}
                    >
                        <button type="submit">削除</button>
                        {/* action がリダイレクトした後、Remix はページのデータのすべての loader を呼び出して最新の値を取得します（これは "再検証" です）。
                        useLoaderData は新しい値を返し、コンポーネントを更新します！ */}
                    </Form>
                </div>
            </div>
        </div>
    );
}

const Favorite: FunctionComponent<{
    contact: Pick<ContactRecord, "favorite">;
}> = ({ contact }) => {
    const fetcher = useFetcher();
    // 楽観的UI
    // ユーザーがボタンをクリックすると、すぐに ★ が表示されます。
    const favorite = fetcher.formData ? fetcher.formData.get("favorite") === "true": contact.favorite;

    return (
        // ナビゲーションなしの Form
        // これまで、フォームはすべてURLを変更していました。
        // これらのユーザーフローは一般的ですが、ナビゲーションなしでフォームを送信したい場合も同様に一般的です。
        // このような場合、useFetcher が役立ちます。これにより、ナビゲーションなしで action と loader と通信できます。
        // 連絡先ページの ★ ボタンは、これに対して理にかなっています。
        // 新しいレコードを作成したり削除したりするのではなく、見ているページのデータを変更したいだけです。
        // <Favorite> フォームをフェッチャーフォームに変更する
        <fetcher.Form method="post">
            <button
                aria-label={
                    favorite
                        ? "お気に入りから削除"
                        : "お気に入りに追加"
                }
                name="favorite"
                value={favorite ? "false" : "true"}
            >
                {favorite ? "★" : "☆"}
            </button>
        </fetcher.Form>
    );
};
