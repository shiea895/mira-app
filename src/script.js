console.log("買い物リストアプリ: 読み込み完了");

const STORAGE_KEY = "mira-app:items";

// localStorageへの書き込みをtry/catchで保護する。写真データなどで保存容量の上限を
// 超えた場合でも例外で処理が止まらないようにし、ユーザーには保存失敗を知らせる。
function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`保存に失敗しました (${key})`, error);
    alert(
      "保存に失敗しました。写真のサイズが大きいか、この端末の保存容量の上限に達している可能性があります。"
    );
    return false;
  }
}

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
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(items));
}

function generateItemId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

let items = loadItems();
saveItems(); // 初回起動時はDEFAULT_ITEMSをそのまま保存データとして確定させる

// アイコン使い回し用の履歴（ステップ13）
const ICON_HISTORY_STORAGE_KEY = "mira-app:icon-history";
const ICON_HISTORY_MAX = 24;

function loadIconHistory() {
  try {
    const raw = localStorage.getItem(ICON_HISTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("アイコン履歴の読み込みに失敗しました", error);
  }
  return [];
}

function saveIconHistory() {
  safeLocalStorageSet(ICON_HISTORY_STORAGE_KEY, JSON.stringify(iconHistory));
}

// 選択されたアイコンを履歴の先頭に追加する(既にあれば先頭へ移動するだけ)
function addIconToHistory(url) {
  if (!url) return;
  iconHistory = iconHistory.filter((entry) => entry.url !== url);
  iconHistory.unshift({ id: generateItemId(), url, createdAt: Date.now() });
  iconHistory = iconHistory.slice(0, ICON_HISTORY_MAX);
  saveIconHistory();
}

let iconHistory = loadIconHistory();

// カテゴリ（固定3種。アプリ内での追加・編集はできない）
// パステル配色: 淡い背景(bg) + 同系色の濃いめ文字(color)の組み合わせ
const CATEGORIES = [
  { name: "食品", label: "食", bg: "#ffe3c2", color: "#b8631a" },
  { name: "日用品", label: "日", bg: "#d6e6fb", color: "#4a77b4" },
  { name: "その他", label: "他", bg: "#cfeee3", color: "#2e8c73" }, // 在庫切れ時のグレーアウト表示と紛らわしくならないよう、グレー以外の色にしている
];
// 万一、過去に存在したカテゴリ名などCATEGORIESに無い値が付いたアイテムがあった場合のフォールバック表示
const DEFAULT_CATEGORY_BADGE = { label: "他", bg: "#eceaf0", color: "#8a8296" };

// 旧バージョン(カテゴリ管理機能)で使っていたデータが残っていれば削除する
localStorage.removeItem("mira-app:categories");

function getCategoryBadge(categoryName) {
  const category = CATEGORIES.find((c) => c.name === categoryName);
  return category || DEFAULT_CATEGORY_BADGE;
}

function getCategoryOrderIndex(categoryName) {
  const index = CATEGORIES.findIndex((c) => c.name === categoryName);
  return index === -1 ? CATEGORIES.length : index;
}

const STATUS_OPTIONS = [
  { value: "in_stock", label: "在庫あり" },
  { value: "need_to_buy", label: "在庫切れ・要購入" },
];

const ALL_CATEGORIES_LABEL = "すべて";

function getCategoryTabs() {
  return [ALL_CATEGORIES_LABEL, ...CATEGORIES.map((c) => c.name)];
}

let currentCategory = ALL_CATEGORIES_LABEL; // 初期表示は「すべて」タブ

function getFilteredItems() {
  if (currentCategory === ALL_CATEGORIES_LABEL) {
    // カテゴリをまたいで表示するので、食品→日用品→その他の順に揃える
    return [...items].sort(
      (a, b) => getCategoryOrderIndex(a.category) - getCategoryOrderIndex(b.category)
    );
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

// アイコン画像(iconUrl)が設定されていればそれを、無ければ頭文字を表示する共通処理
function setIconVisual(el, { iconUrl, name }) {
  el.innerHTML = "";
  if (iconUrl) {
    const img = document.createElement("img");
    img.src = iconUrl;
    img.alt = "";
    el.appendChild(img);
  } else {
    el.textContent = name.charAt(0);
  }
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
  setIconVisual(icon, item);

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "item-tile__edit-btn material-symbols-rounded";
  editButton.setAttribute("aria-label", `${item.name}を編集`);
  editButton.textContent = "edit";
  editButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openItemForm(item);
  });

  iconWrap.append(icon, editButton);

  if (item.memo) {
    const memoButton = document.createElement("button");
    memoButton.type = "button";
    memoButton.className = "item-tile__memo-btn material-symbols-rounded";
    memoButton.textContent = "sticky_note_2";
    memoButton.setAttribute("aria-label", `${item.name}のメモを見る`);
    memoButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openMemoModal(item.name, item.memo);
    });
    iconWrap.appendChild(memoButton);
  }

  const name = document.createElement("div");
  name.className = "item-tile__name";

  const categoryBadge = getCategoryBadge(item.category);
  const badge = document.createElement("span");
  badge.className = "item-tile__category-badge";
  badge.style.backgroundColor = categoryBadge.bg;
  badge.style.color = categoryBadge.color;
  badge.textContent = categoryBadge.label;

  const nameText = document.createElement("span");
  nameText.className = "item-tile__name-text";
  nameText.textContent = item.name;
  nameText.title = item.name; // 省略表示時に長押し/ホバーで全文を確認できるように

  name.append(badge, nameText);

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
  setIconVisual(icon, item);

  const nameWrap = document.createElement("div");
  nameWrap.className = "shopping-item__name-wrap";

  const name = document.createElement("span");
  name.className = "shopping-item__name";
  name.textContent = item.name;
  nameWrap.appendChild(name);

  if (item.memo) {
    const memo = document.createElement("span");
    memo.className = "shopping-item__memo";
    memo.textContent = item.memo;
    nameWrap.appendChild(memo);
  }

  row.append(checkbox, icon, nameWrap);
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

// メモ確認用モーダル
function openMemoModal(itemName, memo) {
  document.getElementById("memo-modal-title").textContent = itemName ? `${itemName}のメモ` : "アイテム名なしのメモ";
  document.getElementById("memo-modal-text").textContent = memo;
  document.getElementById("memo-modal-overlay").hidden = false;
}

function closeMemoModal() {
  document.getElementById("memo-modal-overlay").hidden = true;
}

document.getElementById("memo-modal-close").addEventListener("click", closeMemoModal);
document.getElementById("memo-modal-overlay").addEventListener("click", (event) => {
  if (event.target.id === "memo-modal-overlay") closeMemoModal();
});

// アイテム保存時の入力チェック用モーダル(メモ確認モーダルと同じ形式)
function openValidationModal() {
  document.getElementById("validation-modal-overlay").hidden = false;
}

function closeValidationModal() {
  document.getElementById("validation-modal-overlay").hidden = true;
}

document.getElementById("validation-modal-close").addEventListener("click", closeValidationModal);
document.getElementById("validation-modal-overlay").addEventListener("click", (event) => {
  if (event.target.id === "validation-modal-overlay") closeValidationModal();
});

// 設定画面(S7)は未実装。実装までは案内のボトムシートのみ表示する
function openSettingsSheet() {
  document.getElementById("settings-sheet-overlay").hidden = false;
}

function closeSettingsSheet() {
  document.getElementById("settings-sheet-overlay").hidden = true;
}

document.getElementById("settings-sheet-close").addEventListener("click", closeSettingsSheet);
document.getElementById("settings-sheet-overlay").addEventListener("click", (event) => {
  if (event.target.id === "settings-sheet-overlay") closeSettingsSheet();
});

document.querySelectorAll(".js-settings-btn").forEach((btn) => {
  btn.addEventListener("click", openSettingsSheet);
});

// S4 アイテム登録・編集画面
let formState = null; // { id, name, category, status, memo, iconUrl } / idがnullなら新規追加

function openItemForm(item) {
  formState = item
    ? {
        id: item.id,
        name: item.name,
        category: item.category,
        status: item.status,
        memo: item.memo || "",
        iconUrl: item.iconUrl || null,
      }
    : {
        id: null,
        name: "",
        category: CATEGORIES[0].name,
        status: "in_stock",
        memo: "",
        iconUrl: null,
      };

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
  const preview = document.getElementById("item-form-icon-preview-btn");
  preview.className =
    "item-tile__icon item-form__icon-preview" +
    (formState.status === "need_to_buy" ? " item-tile__icon--out-of-stock" : "");
  setIconVisual(preview, {
    iconUrl: formState.iconUrl,
    name: formState.name || "？",
  });
}

function renderItemFormCategoryChips() {
  const container = document.getElementById("item-form-category");
  container.innerHTML = "";

  for (const category of CATEGORIES) {
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
  if (!name && !formState.iconUrl) {
    openValidationModal();
    return;
  }

  if (formState.id == null) {
    items.push({
      id: generateItemId(),
      name,
      category: formState.category,
      status: formState.status,
      memo: formState.memo,
      iconUrl: formState.iconUrl,
    });
  } else {
    const target = items.find((item) => item.id === formState.id);
    if (target) {
      target.name = name;
      target.category = formState.category;
      target.status = formState.status;
      target.memo = formState.memo;
      target.iconUrl = formState.iconUrl;
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
document.getElementById("item-form-icon-preview-btn").addEventListener("click", openIconPicker);

document.getElementById("item-form-name").addEventListener("input", (event) => {
  formState.name = event.target.value;
  updateItemFormIconPreview();
});

document.getElementById("item-form-memo").addEventListener("input", (event) => {
  formState.memo = event.target.value;
});

// S5 アイコン選択画面
let iconPickerTempUrl = null;

function openIconPicker() {
  iconPickerTempUrl = formState.iconUrl;
  renderIconPickerPreview();
  renderIconHistoryGrid();
  showScreen("screen-icon-picker");
}

function closeIconPicker() {
  showScreen("screen-item-form");
}

function confirmIconPicker() {
  formState.iconUrl = iconPickerTempUrl;
  addIconToHistory(iconPickerTempUrl);
  updateItemFormIconPreview();
  closeIconPicker();
}

function selectIconFromHistory(url) {
  iconPickerTempUrl = url;
  renderIconPickerPreview();
  renderIconHistoryGrid();
}

function renderIconPickerPreview() {
  const preview = document.getElementById("icon-picker-preview");
  setIconVisual(preview, { iconUrl: iconPickerTempUrl, name: formState.name || "？" });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}

// カメラ写真は数MBになることがあり、localStorageの保存容量をすぐに圧迫してしまう。
// 保存前に正方形・小サイズへ縮小してからJPEG圧縮することで、保存できる枚数を大きく増やす。
const ICON_MAX_SIZE = 200;
const ICON_JPEG_QUALITY = 0.7;

async function resizeImageFileToDataUrl(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(originalDataUrl);

  const sourceSize = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - sourceSize) / 2;
  const sy = (img.naturalHeight - sourceSize) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = ICON_MAX_SIZE;
  canvas.height = ICON_MAX_SIZE;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, ICON_MAX_SIZE, ICON_MAX_SIZE);

  return canvas.toDataURL("image/jpeg", ICON_JPEG_QUALITY);
}

async function handleIconFileSelected(event) {
  const file = event.target.files[0];
  event.target.value = ""; // 同じファイルを連続で選んだ時も change イベントが発火するように
  if (!file) return;

  const dataUrl = await resizeImageFileToDataUrl(file);
  iconPickerTempUrl = dataUrl;
  renderIconPickerPreview();
}

document.getElementById("icon-picker-cancel").addEventListener("click", closeIconPicker);
document.getElementById("icon-picker-confirm").addEventListener("click", confirmIconPicker);

document.getElementById("icon-picker-camera-btn").addEventListener("click", () => {
  document.getElementById("icon-picker-camera-input").click();
});
document.getElementById("icon-picker-file-btn").addEventListener("click", () => {
  document.getElementById("icon-picker-file-input").click();
});
document.getElementById("icon-picker-camera-input").addEventListener("change", handleIconFileSelected);
document.getElementById("icon-picker-file-input").addEventListener("change", handleIconFileSelected);

// ステップ13: 一度選んだアイコンを履歴から再選択できるようにする
function renderIconHistoryGrid() {
  const container = document.getElementById("icon-picker-history-grid");
  container.innerHTML = "";

  if (iconHistory.length === 0) {
    const empty = document.createElement("p");
    empty.className = "icon-picker__history-empty";
    empty.textContent = "まだ登録済みのアイコンはありません";
    container.appendChild(empty);
    return;
  }

  for (const entry of iconHistory) {
    const item = document.createElement("button");
    item.type = "button";
    item.className =
      "icon-picker__history-item" +
      (entry.url === iconPickerTempUrl ? " is-selected" : "");
    item.setAttribute("aria-label", "登録済みアイコンを選択");

    const img = document.createElement("img");
    img.src = entry.url;
    img.alt = "";
    item.appendChild(img);

    item.addEventListener("click", () => selectIconFromHistory(entry.url));
    container.appendChild(item);
  }
}
