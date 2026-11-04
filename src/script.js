console.log("買い物リストアプリ: 読み込み完了");

const STORAGE_KEY = "mira-app:items";

// 初回起動時のみ使う初期データ（localStorageに何も無い場合のみ使用）
const DEFAULT_ITEMS = [
  { id: "1", name: "牛乳", category: "食品", status: "need_to_buy", memo: "" },
  { id: "2", name: "卵", category: "食品", status: "in_stock", memo: "" },
  { id: "3", name: "醤油", category: "食品", status: "in_stock", memo: "" },
  { id: "4", name: "トイレットペーパー", category: "日用品", status: "need_to_buy", memo: "" },
  { id: "5", name: "洗剤", category: "日用品", status: "in_stock", memo: "" },
  { id: "6", name: "ティッシュ", category: "日用品", status: "need_to_buy", memo: "" },
  { id: "7", name: "電池", category: "その他", status: "in_stock", memo: "" },
  { id: "8", name: "輪ゴム", category: "その他", status: "need_to_buy", memo: "" },
  { id: "9", name: "パン", category: "食品", status: "in_stock", memo: "" },
];

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("保存データの読み込みに失敗しました", error);
  }
  return DEFAULT_ITEMS.map((item) => ({ ...item }));
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateItemId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

let items = loadItems();
saveItems(); // 初回起動時はDEFAULT_ITEMSをそのまま保存データとして確定させる

const CATEGORY_BADGE = {
  食品: { label: "食", className: "food" },
  日用品: { label: "日", className: "daily" },
};
const DEFAULT_CATEGORY_BADGE = { label: "他", className: "other" };

function getCategoryBadge(category) {
  return CATEGORY_BADGE[category] || DEFAULT_CATEGORY_BADGE;
}

const FORM_CATEGORIES = ["食品", "日用品", "その他"];
const STATUS_OPTIONS = [
  { value: "in_stock", label: "在庫あり" },
  { value: "need_to_buy", label: "在庫切れ・要購入" },
];

const ALL_CATEGORIES_LABEL = "すべて";
const OUT_OF_STOCK_LABEL = "在庫切れ";
const CATEGORY_TABS = [ALL_CATEGORIES_LABEL, OUT_OF_STOCK_LABEL, ...FORM_CATEGORIES];

let currentCategory = ALL_CATEGORIES_LABEL;

function getFilteredItems() {
  if (currentCategory === ALL_CATEGORIES_LABEL) {
    return items;
  }
  if (currentCategory === OUT_OF_STOCK_LABEL) {
    return items.filter((item) => item.status === "need_to_buy");
  }
  return items.filter((item) => item.category === currentCategory);
}

function renderCategoryTabs() {
  const container = document.getElementById("category-tabs");
  container.innerHTML = "";

  for (const category of CATEGORY_TABS) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className =
      "category-tabs__item" +
      (category === currentCategory ? " is-active" : "");
    tab.textContent = category;
    tab.addEventListener("click", () => {
      if (category === currentCategory) return;
      currentCategory = category;
      renderCategoryTabs();
      renderItemList(getFilteredItems());
    });
    container.appendChild(tab);
  }
}

function renderItemList(itemsToRender) {
  const container = document.getElementById("item-list");
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "item-grid";
  for (const item of itemsToRender) {
    grid.appendChild(renderItemTile(item));
  }
  container.appendChild(grid);
}

function toggleItemStatus(item) {
  item.status = item.status === "in_stock" ? "need_to_buy" : "in_stock";
  saveItems();
  renderItemList(getFilteredItems());
}

function renderItemTile(item) {
  const tile = document.createElement("div");
  tile.className = "item-tile";
  tile.addEventListener("click", () => toggleItemStatus(item));

  const iconWrap = document.createElement("div");
  iconWrap.className = "item-tile__icon-wrap";

  const icon = document.createElement("div");
  icon.className =
    "item-tile__icon" +
    (item.status === "need_to_buy" ? " item-tile__icon--out-of-stock" : "");
  icon.textContent = item.name.charAt(0);

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "item-tile__edit-btn";
  editButton.setAttribute("aria-label", `${item.name}を編集`);
  editButton.textContent = "✎";
  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openItemForm(item);
  });

  iconWrap.append(icon, editButton);

  const name = document.createElement("div");
  name.className = "item-tile__name";

  const categoryBadge = getCategoryBadge(item.category);
  const badge = document.createElement("span");
  badge.className = `item-tile__category-badge item-tile__category-badge--${categoryBadge.className}`;
  badge.textContent = categoryBadge.label;

  name.append(badge, document.createTextNode(item.name));

  tile.append(iconWrap, name);
  return tile;
}

renderCategoryTabs();
renderItemList(getFilteredItems());

// S3 買い物リスト画面: 「在庫切れ・要購入」のアイテムだけのチェックリスト
function groupByCategory(itemsToGroup) {
  const groups = new Map();
  for (const item of itemsToGroup) {
    if (!groups.has(item.category)) {
      groups.set(item.category, []);
    }
    groups.get(item.category).push(item);
  }
  return groups;
}

function markItemAsPurchased(item) {
  item.status = "in_stock";
  saveItems();
  renderShoppingList();
  renderItemList(getFilteredItems());
}

function renderShoppingItemRow(item) {
  const row = document.createElement("label");
  row.className = "shopping-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "shopping-item__checkbox";
  checkbox.addEventListener("change", () => markItemAsPurchased(item));

  const icon = document.createElement("span");
  icon.className = "shopping-item__icon";
  icon.textContent = item.name.charAt(0);

  const name = document.createElement("span");
  name.className = "shopping-item__name";
  name.textContent = item.name;

  row.append(checkbox, icon, name);
  return row;
}

function renderShoppingList() {
  const container = document.getElementById("shopping-list");
  container.innerHTML = "";

  const shoppingItems = items.filter((item) => item.status === "need_to_buy");
  document.getElementById("shopping-count").textContent =
    shoppingItems.length > 0 ? `${shoppingItems.length}件` : "";

  if (shoppingItems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "shopping-list__empty";
    empty.textContent = "買うものはありません";
    container.appendChild(empty);
    return;
  }

  const groups = groupByCategory(shoppingItems);
  for (const [category, categoryItems] of groups) {
    const heading = document.createElement("h2");
    heading.className = "shopping-list__category";
    heading.textContent = category;
    container.appendChild(heading);

    for (const item of categoryItems) {
      container.appendChild(renderShoppingItemRow(item));
    }
  }
}

// 画面遷移（下部ナビゲーション）
function showScreen(screenId) {
  for (const screen of document.querySelectorAll(".screen")) {
    screen.hidden = screen.id !== screenId;
  }
}

function navigateTo(screenId) {
  showScreen(screenId);
  document.querySelectorAll(".bottom-nav__item[data-screen]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.screen === screenId);
  });

  if (screenId === "screen-home") {
    renderItemList(getFilteredItems());
  } else if (screenId === "screen-shopping") {
    renderShoppingList();
  }
}

document.querySelectorAll(".bottom-nav__item[data-screen]").forEach((btn) => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.screen));
});

// S4 アイテム登録・編集画面
let formState = null; // { id, name, category, status, memo } / idがnullなら新規追加

function openItemForm(item) {
  formState = item
    ? { id: item.id, name: item.name, category: item.category, status: item.status, memo: item.memo || "" }
    : { id: null, name: "", category: FORM_CATEGORIES[0], status: "in_stock", memo: "" };

  document.getElementById("item-form-title").textContent = item ? "アイテムを編集" : "アイテムを追加";
  document.getElementById("item-form-delete").hidden = !item;
  document.getElementById("item-form-name").value = formState.name;
  document.getElementById("item-form-memo").value = formState.memo;

  renderItemFormCategoryChips();
  renderItemFormStatusChips();
  updateItemFormIconPreview();

  showScreen("screen-item-form");
}

function closeItemForm() {
  formState = null;
  showScreen("screen-home");
}

function updateItemFormIconPreview() {
  const preview = document.getElementById("item-form-icon-preview");
  preview.textContent = formState.name.charAt(0) || "？";
  preview.className =
    "item-tile__icon item-form__icon-preview" +
    (formState.status === "need_to_buy" ? " item-tile__icon--out-of-stock" : "");
}

function renderItemFormCategoryChips() {
  const container = document.getElementById("item-form-category");
  container.innerHTML = "";

  for (const category of FORM_CATEGORIES) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className =
      "item-form__chip" +
      (category === formState.category ? " is-selected" : "");
    chip.textContent = category;
    chip.addEventListener("click", () => {
      formState.category = category;
      renderItemFormCategoryChips();
    });
    container.appendChild(chip);
  }
}

function renderItemFormStatusChips() {
  const container = document.getElementById("item-form-status");
  container.innerHTML = "";

  for (const option of STATUS_OPTIONS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className =
      "item-form__chip" +
      (option.value === formState.status ? " is-selected" : "");
    chip.textContent = option.label;
    chip.addEventListener("click", () => {
      formState.status = option.value;
      renderItemFormStatusChips();
      updateItemFormIconPreview();
    });
    container.appendChild(chip);
  }
}

function saveItemForm() {
  const name = formState.name.trim();
  if (!name) {
    alert("アイテム名を入力してください");
    return;
  }

  if (formState.id == null) {
    items.push({
      id: generateItemId(),
      name,
      category: formState.category,
      status: formState.status,
      memo: formState.memo,
    });
  } else {
    const target = items.find((item) => item.id === formState.id);
    if (target) {
      target.name = name;
      target.category = formState.category;
      target.status = formState.status;
      target.memo = formState.memo;
    }
  }

  saveItems();
  closeItemForm();
  renderItemList(getFilteredItems());
}

function deleteItemForm() {
  if (formState.id == null) return;
  if (!window.confirm("このアイテムを削除しますか？")) return;

  items = items.filter((item) => item.id !== formState.id);
  saveItems();
  closeItemForm();
  renderItemList(getFilteredItems());
}

document.getElementById("fab-add-item").addEventListener("click", () => openItemForm());
document.getElementById("item-form-cancel").addEventListener("click", closeItemForm);
document.getElementById("item-form-save").addEventListener("click", saveItemForm);
document.getElementById("item-form-delete").addEventListener("click", deleteItemForm);

document.getElementById("item-form-name").addEventListener("input", (event) => {
  formState.name = event.target.value;
  updateItemFormIconPreview();
});

document.getElementById("item-form-memo").addEventListener("input", (event) => {
  formState.memo = event.target.value;
});
