import { json, redirect } from "@remix-run/node";

import {
  Form,
  // Link,
  // アクティブリンクのスタイリング
  // たくさんのレコードが表示されるようになりましたが、サイドバーでどのレコードを見ているのか分かりません。
  // これを解決するために NavLink を使用できます。サイドバーの <Link> を <NavLink> に置き換えてください
  NavLink,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  // グローバル保留UI
  // ユーザーがアプリ内を移動すると、Remixは次のページのデータが読み込まれる間、古いページを表示したままにします。
  // リスト間をクリックすると、アプリが少し反応しないように感じるかもしれません。
  // アプリが反応していないように感じさせないように、ユーザーにフィードバックを提供しましょう。
  // Remixは、すべてを舞台裏で管理し、動的なWebアプリを構築するために必要な部分を明らかにします。
  // この場合、useNavigationフックを使用します。
  useNavigation,
  useSubmit,
} from "@remix-run/react";

import { useEffect } from "react";

// links を使ったスタイルシートの追加
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import appStyleHref from "./app.css?url";
import { createEmptyContact, getContacts } from "./data";

// 連絡先の作成
// ルートルートに action 関数をエクスポートすることで、新しい連絡先を作成します。
// ユーザーが「新規」ボタンをクリックすると、フォームはルートルートアクションに POST します。
export const action = async () => {
  const contact = await createEmptyContact();
  // 新規レコードを編集ページにリダイレクトする
  // 新しい連絡先を作成するアクションを更新して、編集ページにリダイレクトするようにしましょう。
  // これで、「新規」をクリックすると、編集ページに移動します。
  return redirect(`/contacts/${contact.id}/edit`);
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStyleHref },
];


// データの読み込み
// データを読み込むには、loader と useLoaderData の 2 つの API を使用します。
// まず、ルートルートに loader 関数を定義してエクスポートし、データをレンダリングします。
export const loader = async ({ request, }: LoaderFunctionArgs) => {
  // URLSearchParamsとGET送信
  // loader関数は、requestから検索パラメータにアクセスできます。これを利用してリストをフィルターしてみましょう。
  const url = new URL(request.url);
  // これはPOSTではなくGETなので、Remixはaction関数を呼び出しません。
  // GETのformを送信することは、リンクをクリックすることと同じです。URLだけが変更されます。
  const q = url.searchParams.get("q");
  const contacts = await getContacts(q);
  return json({ contacts, q });
};

export default function App() {
  // 型推論
  // typeof loader を使って、データに関する型推論を得るために、簡単な注釈を追加することができます。
  const { contacts, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  // ユーザーがタイプするたびにフィルタリングしたい場合、useNavigateの仲間であるuseSubmitを使用します。
  const submit = useSubmit();

  // 検索スピナーの追加
  // ローディングインジケーターがないと、検索は少し遅く感じられます。
  // データベースを高速化できたとしても、ユーザーのネットワーク遅延は常に発生し、コントロールできません。
  // より良いユーザーエクスペリエンスのために、検索の直感的なUIフィードバックを追加しましょう。useNavigationを再び使用します。
  const searching = navigation.location && new URLSearchParams(navigation.location.search).has("q");

  // 戻る/進む/更新ボタンをクリックしても、入力の値が URL と結果と同期するようになります。
  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
            {/* <Form method="post">ではないので、Remixはブラウザをエミュレートし、
              FormDataをリクエストボディではなくURLSearchParamsにシリアライズします。 */}
            {/* submitへの引数に注目してください。submit関数は、渡されたフォームをシリアライズして送信します。
              ここではevent.currentTargetを渡しています。currentTargetは、イベントがアタッチされているDOMノード（form）です。 */}
            <Form id="search-form"
              onChange={(event) => {
                // 履歴スタックの管理
                // 最初の検索かどうかを簡単に確認した後、置き換えを実行します。
                // これで、最初の検索は新しいエントリを追加しますが、それ以降のキーストロークは現在のエントリを置き換えます。
                // 検索を削除するために7回戻る代わりに、ユーザーは1回戻るだけで済みます。
                const isFirstSerach = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSerach,
                });
              }}
              role="search">

              <input
                // 検索後にページを更新すると、フォームフィールドには値が入らなくなりますが、リストはフィルターされます。
                aria-label="検索"
                className={searching ? "loading" : ""}
                defaultValue={q || ""}
                id="q"
                name="q"
                placeholder="検索"
                type="search"
              />
              <div id="search-spinner" aria-hidden hidden={!searching} />
            </Form>
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    {/* クライアントサイドルーティング */}
                    {/* クライアントサイドルーティングを使用すると、アプリケーションはサーバーから別のドキュメントをリクエストせずにURLを更新できます。代わりに、アプリはすぐに新しいUIをレンダリングできます。 */}
                    {/* <a href> を <Link to> に変更 */}
                    {/* <Link to={`contacts/${contact.id}`}> */}

                    {/* className に関数を渡していることに注意してください。 */}
                    {/* ユーザーが <NavLink to> に一致する URL にいる場合、isActive は true になります。 */}
                    {/* アクティブになる 直前 の場合（データがまだロード中）、isPending は true になります。 */}
                    {/* これにより、ユーザーがどこにいて、リンクをクリックしたときにデータがロードされるのを待つ必要があり、すぐにフィードバックを提供することができます。 */}
                    <NavLink className={({ isActive, isPending }) => (isActive ? "active" : isPending ? "pending" : "")} to={`contacts/${contact.id}`}>
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                        </>
                      ) : (
                        <i>名前なし</i>
                      )}{" "}
                      {contact.favorite ? (
                        <span>★</span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>連絡先がないよ</i>
              </p>
            )}
          </nav>
        </div>

        {/* ネストされたルートとアウトレット */}
        {/* Remix は React Router をベースに構築されているため、ネストされたルーティングをサポートしています。 */}
        {/* 子ルートを親レイアウト内にレンダリングするには、親に Outlet をレンダリングする必要があります。 */}
        <div className={navigation.state === "loading" && !searching ? "loading" : ""} id="detail">
          <Outlet />
        </div>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
