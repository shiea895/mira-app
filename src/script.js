console.log("買い物リストアプリ: 読み込み完了");

// ダミーデータ（ステップ4: S2ホーム画面の静的UI確認用。保存機能はまだ無い）
const DUMMY_ITEMS = [
  { id: 1, name: "牛乳", category: "食品", status: "need_to_buy" },
  { id: 2, name: "卵", category: "食品", status: "in_stock" },
  { id: 3, name: "醤油", category: "食品", status: "in_stock" },
  { id: 4, name: "トイレットペーパー", category: "日用品", status: "need_to_buy" },
  { id: 5, name: "洗剤", category: "日用品", status: "in_stock" },
  { id: 6, name: "ティッシュ", category: "日用品", status: "need_to_buy" },
];

const STATUS_LABEL = {
  in_stock: "在庫あり",
  need_to_buy: "在庫切れ・要購入",
};

function groupByCategory(items) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) {
      groups.set(item.category, []);
    }
    groups.get(item.category).push(item);
  }
  return groups;
}

function renderItemList(items) {
  const container = document.getElementById("item-list");
  container.innerHTML = "";

  const groups = groupByCategory(items);
  for (const [category, categoryItems] of groups) {
    const heading = document.createElement("h2");
    heading.className = "item-list__category";
    heading.textContent = category;
    container.appendChild(heading);

    for (const item of categoryItems) {
      container.appendChild(renderItemCard(item));
    }
  }
}

function renderItemCard(item) {
  const card = document.createElement("div");
  card.className = "item-card";

  const icon = document.createElement("div");
  icon.className = "item-card__icon";
  icon.textContent = item.name.charAt(0);

  const name = document.createElement("span");
  name.className = "item-card__name";
  name.textContent = item.name;

  const badge = document.createElement("span");
  badge.className =
    "item-card__badge" +
    (item.status === "need_to_buy" ? " item-card__badge--need-to-buy" : "");
  badge.textContent = STATUS_LABEL[item.status];

  card.append(icon, name, badge);
  return card;
}

renderItemList(DUMMY_ITEMS);
