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

// カテゴリ（ステップ11: S6で追加・削除・並び替えができる）
const CATEGORY_STORAGE_KEY = "mira-app:categories";
const DEFAULT_CATEGORIES = [
  { id: "food", name: "食品", color: "#e08a2c" },
  { id: "daily", name: "日用品", color: "#2d7cf0" },
  { id: "other", name: "その他", color: "#888888" },
];
const CATEGORY_COLOR_PALETTE = [
  "#e08a2c", "#2d7cf0", "#43a047", "#8e24aa", "#d23c3c", "#009688", "#795548",
];
const DEFAULT_CATEGORY_BADGE = { label: "他", color: "#888888" };

function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("カテゴリの読み込みに失敗しました", error);
  }
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
}

function saveCategories() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
}

function generateCategoryId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

let categories = loadCategories();
saveCategories();

function getCategoryBadge(categoryName) {
  const category = categories.find((c) => c.name === categoryName);
  if (!category) return DEFAULT_CATEGORY_BADGE;
  return { label: category.name.charAt(0), color: category.color };
}

const STATUS_OPTIONS = [
  { value: "in_stock", label: "在庫あり" },
  { value: "need_to_buy", label: "在庫切れ・要購入" },
];

const ALL_CATEGORIES_LABEL = "すべて";
const OUT_OF_STOCK_LABEL = "在庫切れ";

function getCategoryTabs() {
  return [ALL_CATEGORIES_LABEL, OUT_OF_STOCK_LABEL, ...categories.map((c) => c.name)];
}

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
  const tabs = getCategoryTabs();
  if (!tabs.includes(currentCategory)) {
    currentCategory = ALL_CATEGORIES_LABEL;
  }

  const container = document.getElementById("category-tabs");
  container.innerHTML = "";

  for (const category of tabs) {
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
  badge.className = "item-tile__category-badge";
  badge.style.backgroundColor = categoryBadge.color;
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

// チェックは「買い物かごに入れた」印にとどめ、実際の在庫反映は「買い物終了」ボタンでまとめて行う
const checkedForPurchase = new Set();

function toggleShoppingCheck(item) {
  if (checkedForPurchase.has(item.id)) {
    checkedForPurchase.delete(item.id);
  } else {
    checkedForPurchase.add(item.id);
  }
  renderShoppingList();
}

function finishShopping() {
  if (checkedForPurchase.size === 0) return;

  for (const item of items) {
    if (checkedForPurchase.has(item.id)) {
      item.status = "in_stock";
    }
  }
  checkedForPurchase.clear();
  saveItems();
  renderShoppingList();
  renderItemList(getFilteredItems());
}

function renderShoppingItemRow(item) {
  const isChecked = checkedForPurchase.has(item.id);

  const row = document.createElement("label");
  row.className = "shopping-item" + (isChecked ? " is-checked" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "shopping-item__checkbox";
  checkbox.checked = isChecked;
  checkbox.addEventListener("change", () => toggleShoppingCheck(item));

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

  const finishButton = document.getElementById("finish-shopping-btn");

  if (shoppingItems.length === 0) {
    const empty = document.createElement("p");
    empty.className = "shopping-list__empty";
    empty.textContent = "買うものはありません";
    container.appendChild(empty);
    finishButton.hidden = true;
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

  finishButton.hidden = false;
  finishButton.disabled = checkedForPurchase.size === 0;
  finishButton.textContent =
    checkedForPurchase.size > 0
      ? `買い物終了（${checkedForPurchase.size}件を在庫ありにする）`
      : "買い物終了";
}

document.getElementById("finish-shopping-btn").addEventListener("click", finishShopping);

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

// S6 カテゴリ管理画面
function openCategoryManage() {
  renderCategoryManageList();
  showScreen("screen-category-manage");
}

function closeCategoryManage() {
  showScreen("screen-home");
  renderCategoryTabs();
  renderItemList(getFilteredItems());
}

function moveCategory(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= categories.length) return;
  [categories[index], categories[target]] = [categories[target], categories[index]];
  saveCategories();
  renderCategoryManageList();
}

function deleteCategory(index) {
  if (categories.length <= 1) {
    alert("最後のカテゴリは削除できません");
    return;
  }
  if (!window.confirm(`「${categories[index].name}」を削除しますか？`)) return;
  categories.splice(index, 1);
  saveCategories();
  renderCategoryManageList();
}

function addCategory() {
  const input = document.getElementById("category-manage-input");
  const name = input.value.trim();
  if (!name) return;
  if (categories.some((c) => c.name === name)) {
    alert("同じ名前のカテゴリが既にあります");
    return;
  }
  categories.push({
    id: generateCategoryId(),
    name,
    color: CATEGORY_COLOR_PALETTE[categories.length % CATEGORY_COLOR_PALETTE.length],
  });
  saveCategories();
  input.value = "";
  renderCategoryManageList();
}

function renderCategoryManageList() {
  const container = document.getElementById("category-manage-list");
  container.innerHTML = "";

  categories.forEach((category, index) => {
    const row = document.createElement("div");
    row.className = "category-manage-row";

    const badge = document.createElement("span");
    badge.className = "category-manage-row__badge";
    badge.style.backgroundColor = category.color;
    badge.textContent = category.name.charAt(0);

    const name = document.createElement("span");
    name.className = "category-manage-row__name";
    name.textContent = category.name;

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "category-manage-row__move";
    upBtn.textContent = "↑";
    upBtn.disabled = index === 0;
    upBtn.addEventListener("click", () => moveCategory(index, -1));

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "category-manage-row__move";
    downBtn.textContent = "↓";
    downBtn.disabled = index === categories.length - 1;
    downBtn.addEventListener("click", () => moveCategory(index, 1));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "category-manage-row__delete";
    deleteBtn.textContent = "🗑";
    deleteBtn.setAttribute("aria-label", `${category.name}を削除`);
    deleteBtn.addEventListener("click", () => deleteCategory(index));

    row.append(badge, name, upBtn, downBtn, deleteBtn);
    container.appendChild(row);
  });
}

document.getElementById("category-manage-btn").addEventListener("click", openCategoryManage);
document.getElementById("category-manage-back").addEventListener("click", closeCategoryManage);
document.getElementById("category-manage-add-btn").addEventListener("click", addCategory);

// S4 アイテム登録・編集画面
let formState = null; // { id, name, category, status, memo } / idがnullなら新規追加

function openItemForm(item) {
  formState = item
    ? { id: item.id, name: item.name, category: item.category, status: item.status, memo: item.memo || "" }
    : { id: null, name: "", category: categories[0] ? categories[0].name : "", status: "in_stock", memo: "" };

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

  for (const category of categories) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className =
      "item-form__chip" +
      (category.name === formState.category ? " is-selected" : "");
    chip.textContent = category.name;
    chip.addEventListener("click", () => {
      formState.category = category.name;
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
