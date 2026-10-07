console.log("買い物リストアプリ: 読み込み完了");

// ダミーデータ（ステップ4: S2ホーム画面の静的UI確認用。保存機能はまだ無い）
const DUMMY_ITEMS = [
  { id: 1, name: "牛乳", category: "食品", status: "need_to_buy" },
  { id: 2, name: "卵", category: "食品", status: "in_stock" },
  { id: 3, name: "醤油", category: "食品", status: "in_stock" },
  { id: 4, name: "トイレットペーパー", category: "日用品", status: "need_to_buy" },
  { id: 5, name: "洗剤", category: "日用品", status: "in_stock" },
  { id: 6, name: "ティッシュ", category: "日用品", status: "need_to_buy" },
  { id: 7, name: "電池", category: "その他", status: "in_stock" },
  { id: 8, name: "輪ゴム", category: "その他", status: "need_to_buy" },
  { id: 9, name: "パン", category: "食品", status: "in_stock" },
];

const CATEGORY_BADGE = {
  食品: { label: "食", className: "food" },
  日用品: { label: "日", className: "daily" },
};
const DEFAULT_CATEGORY_BADGE = { label: "他", className: "other" };

function getCategoryBadge(category) {
  return CATEGORY_BADGE[category] || DEFAULT_CATEGORY_BADGE;
}

function renderItemList(items) {
  const container = document.getElementById("item-list");
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "item-grid";
  for (const item of items) {
    grid.appendChild(renderItemTile(item));
  }
  container.appendChild(grid);
}

function renderItemTile(item) {
  const tile = document.createElement("div");
  tile.className = "item-tile";

  const icon = document.createElement("div");
  icon.className =
    "item-tile__icon" +
    (item.status === "need_to_buy" ? " item-tile__icon--out-of-stock" : "");
  icon.textContent = item.name.charAt(0);

  const name = document.createElement("div");
  name.className = "item-tile__name";

  const categoryBadge = getCategoryBadge(item.category);
  const badge = document.createElement("span");
  badge.className = `item-tile__category-badge item-tile__category-badge--${categoryBadge.className}`;
  badge.textContent = categoryBadge.label;

  name.append(badge, document.createTextNode(item.name));

  tile.append(icon, name);
  return tile;
}

renderItemList(DUMMY_ITEMS);
