/**
 * ライフサポートあさひ HP用 Google Apps Script
 * スプレッドシートのデータをJSON形式で返すWeb API
 * 
 * 方式B対応: セクション分けされたシートに対応
 * - sheet: シート名（例: トップページ）
 * - section: セクション名（例: ニュース、スライダー）省略時は最初のセクション
 * - mode=batch: 全データを一括取得（高速化用）
 */

function doGet(e) {
  const mode = e.parameter.mode || 'single';

  // パージモード: キャッシュを強制削除
  if (mode === 'purge') {
    return clearHpCache();
  }

  // バッチモード: 全シートの全セクションを一括取得（キャッシュ対応）
  if (mode === 'batch') {
    return getBatchDataWithCache_();
  }

  // 通常モード: 単一シート/セクション取得
  const sheetName = e.parameter.sheet || 'トップページ';
  const sectionName = e.parameter.section || null;
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const targetSheet = spreadsheet.getSheetByName(sheetName);

  if (!targetSheet) {
    return jsonOutput_({ error: 'Sheet not found: ' + sheetName });
  }

  const data = targetSheet.getDataRange().getValues();

  // セクション名が指定されていない場合は従来通り全データを返す
  if (!sectionName) {
    return jsonOutput_(parseSimpleSheet(data)); // JSON文字列ではないのでstringifyされる
  }

  // セクション名が指定されている場合はセクションを探す
  return parseSectionedSheet(data, sectionName); // 既存関数内でjsonOutputしているためそのまま返す（要確認）
}

/**
 * キャッシュ付きでバッチデータを取得
 */
function getBatchDataWithCache_() {
  const CACHE_KEY = 'hp_json_v1';
  const TTL = 180; // 3分

  const cache = CacheService.getScriptCache();
  const cachedJson = cache.get(CACHE_KEY);

  // 1) キャッシュがあれば即返す
  if (cachedJson) {
    return jsonOutput_(cachedJson, true); // true = 既にJSON文字列
  }

  // 2) キャッシュがない場合はデータ生成
  try {
    const data = buildBatchData_();
    const jsonString = JSON.stringify(data);

    // キャッシュ保存
    try {
      cache.put(CACHE_KEY, jsonString, TTL);
    } catch (e) {
      console.warn('Cache put failed:', e);
    }

    return jsonOutput_(jsonString, true);
  } catch (e) {
    return jsonOutput_({ error: e.message });
  }
}

/**
 * スプレッドシートからデータを構築する関数（純粋なデータ生成）
 */
function buildBatchData_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};

  // 取得するシートとセクションの定義
  const sheetConfigs = {
    'トップページ': ['ニュース', 'スライダー', '統計データ'],
    '会社概要': ['会社情報', '沿革'],
    '社員紹介': null,  // セクションなし
    '事業所一覧': ['画像一覧', '施設情報', 'ページテキスト'],
    '求人': ['カード一覧', '正社員詳細', '登録ヘルパー詳細', '社保ヘルパー詳細', '職場体験詳細'],
    'お問い合わせ': null  // セクションなし
  };

  for (const sheetName in sheetConfigs) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) continue;

    const data = sheet.getDataRange().getValues();
    const sections = sheetConfigs[sheetName];

    if (sections === null) {
      result[sheetName] = parseSheetData(data);
    } else {
      result[sheetName] = {};
      for (const sectionName of sections) {
        result[sheetName][sectionName] = parseSectionData(data, sectionName);
      }
    }
  }

  return result;
}

/**
 * キャッシュ削除用関数
 */
function clearHpCache() {
  CacheService.getScriptCache().remove('hp_json_v1');
  return jsonOutput_({ status: 'success', message: 'Cache cleared: hp_json_v1' });
}

/**
 * JSON返却用ヘルパー
 * contentがオブジェクトならstringifyし、文字列ならそのまま使う
 */
function jsonOutput_(content, isAlreadyString = false) {
  const jsonString = isAlreadyString ? content : JSON.stringify(content);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * シートデータをオブジェクト配列に変換（セクションなし）
 */
function parseSheetData(data) {
  const headers = data[0];
  const rows = data.slice(1);

  return rows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
}

/**
 * セクション内のデータをオブジェクト配列に変換
 */
function parseSectionData(data, targetSection) {
  let currentSection = null;
  let sectionHeaders = null;
  let sectionData = [];
  let foundSection = false;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const firstCell = String(row[0]).trim();

    // セクションヘッダーの検出（[セクション名] の形式）
    const sectionMatch = firstCell.match(/^\[(.+?)\]$/);

    if (sectionMatch) {
      if (foundSection) break;
      currentSection = sectionMatch[1].trim();
      sectionHeaders = null;
      if (currentSection === targetSection) {
        foundSection = true;
      }
      continue;
    }

    if (foundSection) {
      if (row.every(cell => cell === '')) continue;
      if (!sectionHeaders) {
        sectionHeaders = row; // ヘッダーのインデックスを保持するためにそのまま使用
        continue;
      }
      const obj = {};
      sectionHeaders.forEach((header, index) => {
        if (header !== '') { // ヘッダー名が存在する列のみマッピング
          obj[header] = row[index];
        }
      });
      sectionData.push(obj);
    }
  }

  return sectionData;
}

/**
 * 従来のシンプルなシート形式をパース
 * 1行目がヘッダー、2行目以降がデータ
 */
function parseSimpleSheet(data) {
  const headers = data[0];
  const rows = data.slice(1);

  const jsonData = rows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

  return ContentService.createTextOutput(JSON.stringify(jsonData))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * セクション分けされたシートをパース
 * セクションは「===セクション名===」の形式で区切る
 * 例:
 * === ニュース ===
 * date, text, tag, content
 * 2025.01.01, タイトル, お知らせ, 内容
 * 
 * === スライダー ===
 * url, label
 * https://..., ラベル
 */
function parseSectionedSheet(data, targetSection) {
  let currentSection = null;
  let sectionHeaders = null;
  let sectionData = [];
  let foundSection = false;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const firstCell = String(row[0]).trim();

    // セクションヘッダーの検出（[セクション名] または === セクション名 === の形式）
    const sectionMatch = firstCell.match(/^\[(.+?)\]$/) || firstCell.match(/^=== (.+?) ===$/);

    if (sectionMatch) {
      // 新しいセクション開始
      // もし既に目的のセクションを見つけていたら、ここで終了
      if (foundSection) {
        break;
      }

      currentSection = sectionMatch[1].trim();
      sectionHeaders = null;

      if (currentSection === targetSection) {
        foundSection = true;
      }
      continue;
    }

    // 目的のセクション内のデータを処理
    if (foundSection) {
      // 空行はスキップ
      if (row.every(cell => cell === '')) {
        continue;
      }

      // ヘッダー行を設定
      if (!sectionHeaders) {
        sectionHeaders = row;
        continue;
      }

      // データ行を追加
      const obj = {};
      sectionHeaders.forEach((header, index) => {
        if (header !== '') {
          obj[header] = row[index];
        }
      });
      sectionData.push(obj);
    }
  }

  if (!foundSection) {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Section not found: ' + targetSection + ' in sheet'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify(sectionData))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// フォーム送信処理（POST）
// ============================================

/**
 * メール送信先設定
 * 求人フォーム（recruit）とお問い合わせフォーム（contact）で宛先を分離
 */
const EMAIL_CONFIG = {
  // 求人応募フォームの送信先（複数可、カンマ区切り）
  recruit: {
    to: 'hirayamakodai@asahi4649.com, asahi.4649.041@gmail.com, hirayamamiki4649@gmail.com, asahi.4649.025@gmail.com',
    subject: '【求人応募】ライフサポートあさひ HP'
  },
  // お問い合わせフォームの送信先（複数可、カンマ区切り）
  contact: {
    to: 'hirayamakodai@asahi4649.com, asahi.4649.005@gmail.com, asahi.4649.017@gmail.com, asahi.4649.033@gmail.com,asahi.4649.041@gmail.com',
    subject: '【お問い合わせ】ライフサポートあさひ HP'
  }
};

/**
 * 自動返信（控えメール）設定
 * フォーム送信者本人の入力メールアドレス宛に、控えメールを送る際の設定
 */
const AUTO_REPLY_CONFIG = {
  senderName: 'ライフサポートあさひ',          // 差出人の表示名
  replyTo: 'hirayamakodai@asahi4649.com',       // 返信先アドレス
  tel: '06-6746-7800',
  address: '〒577-0011 大阪府東大阪市荒本北2丁目5-5',
  recruit: { subject: '【自動返信】ご応募を受け付けました｜ライフサポートあさひ' },
  contact: { subject: '【自動返信】お問い合わせを受け付けました｜ライフサポートあさひ' }
};

/**
 * POSTリクエストを処理してメールを送信
 * GASのCORS制限に対応するため、特別な処理を行う
 */
function doPost(e) {
  // デバッグ用：スプレッドシートにログを書き込む
  const debugLog = (message) => {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let debugSheet = ss.getSheetByName('デバッグログ');
      if (!debugSheet) {
        debugSheet = ss.insertSheet('デバッグログ');
        debugSheet.appendRow(['日時', 'メッセージ']);
      }
      const now = new Date();
      const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
      debugSheet.appendRow([timestamp, message]);
    } catch (err) {
      // ログ書き込みエラーは無視
    }
  };

  try {
    debugLog('doPost called');
    debugLog('e: ' + JSON.stringify(e));

    // e.postDataがない場合のエラーハンドリング
    if (!e || !e.postData || !e.postData.contents) {
      debugLog('postData is empty or undefined');
      debugLog('e.parameter: ' + (e ? JSON.stringify(e.parameter) : 'undefined'));
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'リクエストデータが空です'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // リクエストボディをパース
    debugLog('postData.contents: ' + e.postData.contents);
    const data = JSON.parse(e.postData.contents);
    debugLog('Parsed data: ' + JSON.stringify(data));

    // 二重送信（スパム）チェック（5分間）
    if (checkDuplicateSubmission_(data)) {
      debugLog('Duplicate submission detected');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '短期間に同一の内容が送信されました。しばらく待ってから再送してください。'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // フォームタイプで送信先を切り替え（recruit / contact）
    const formType = data.formType || 'contact';
    const config = EMAIL_CONFIG[formType] || EMAIL_CONFIG.contact;

    debugLog('formType: ' + formType);
    debugLog('Sending email to: ' + config.to);

    // メール本文を構築
    const body = buildEmailBody_(data, formType);

    // メール送信
    MailApp.sendEmail({
      to: config.to,
      subject: config.subject,
      body: body
    });

    debugLog('Email sent successfully');

    // 送信者本人へ控え（自動返信）メールを送信
    // 失敗しても会社宛メール送信・記録には影響させない
    try {
      if (isValidEmail_(data.email)) {
        const replyConfig = AUTO_REPLY_CONFIG[formType] || AUTO_REPLY_CONFIG.contact;
        MailApp.sendEmail({
          to: data.email,
          subject: replyConfig.subject,
          body: buildConfirmationBody_(data, formType),
          name: AUTO_REPLY_CONFIG.senderName,
          replyTo: AUTO_REPLY_CONFIG.replyTo
        });
        debugLog('Auto-reply sent to: ' + data.email);
      } else {
        debugLog('Auto-reply skipped (invalid email): ' + (data.email || '(empty)'));
      }
    } catch (replyErr) {
      debugLog('Auto-reply failed: ' + replyErr.message);
    }

    // スプレッドシートにも記録
    logToSheet_(data, formType);

    debugLog('Data logged to sheet');

    // 成功レスポンス
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'メールを送信しました'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    debugLog('Error: ' + error.message);
    debugLog('Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * メール本文を構築
 */
function buildEmailBody_(data, formType) {
  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

  let body = '';
  body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  body += formType === 'recruit' ? '【求人応募】' : '【お問い合わせ】';
  body += ' ライフサポートあさひ HP\n';
  body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  body += '受信日時: ' + timestamp + '\n\n';

  if (formType === 'recruit') {
    // 求人フォーム用
    body += '■ お名前\n' + (data.name || '未入力') + '\n\n';
    body += '■ メールアドレス\n' + (data.email || '未入力') + '\n\n';
    body += '■ 電話番号\n' + (data.phone || '未入力') + '\n\n';
    body += '■ 連絡希望\n' + (data.contactMethod || '未入力') + '\n\n';
    if (data.preferredTime) {
      body += '■ 希望連絡時間・曜日\n' + data.preferredTime + '\n\n';
    }
    body += '■ 希望職種\n' + (data.jobType || '未入力') + '\n\n';
    body += '■ 希望面接場所・形式\n' + (data.interviewType || '未入力') + '\n\n';
  } else {
    // お問い合わせフォーム用
    body += '■ お名前\n' + (data.name || '未入力') + '\n\n';
    body += '■ メールアドレス\n' + (data.email || '未入力') + '\n\n';
    body += '■ 電話番号\n' + (data.phone || '未入力') + '\n\n';
    body += '■ 連絡方法\n' + (data.contactMethod || '未入力') + '\n\n';
    body += '■ メッセージ本文\n' + (data.message || '未入力') + '\n\n';
  }

  body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  body += 'このメールは自動送信です。\n';

  return body;
}

/**
 * 送信者本人宛の控え（自動返信）メール本文を構築
 */
function buildConfirmationBody_(data, formType) {
  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  const name = (data.name && String(data.name).trim()) ? data.name : 'ご担当者';

  let body = '';
  body += name + ' 様\n\n';

  if (formType === 'recruit') {
    body += 'この度はライフサポートあさひの求人にご応募いただき、誠にありがとうございます。\n';
    body += '以下の内容でご応募を受け付けいたしました。担当者より追ってご連絡いたしますので、今しばらくお待ちください。\n\n';
  } else {
    body += 'この度はライフサポートあさひへお問い合わせいただき、誠にありがとうございます。\n';
    body += '以下の内容でお問い合わせを受け付けいたしました。担当者より追ってご連絡いたしますので、今しばらくお待ちください。\n\n';
  }

  body += '──────────────────────────────\n';
  body += '【ご入力内容の控え】\n';
  body += '受付日時: ' + timestamp + '\n\n';

  if (formType === 'recruit') {
    body += '■ お名前\n' + (data.name || '未入力') + '\n\n';
    body += '■ メールアドレス\n' + (data.email || '未入力') + '\n\n';
    body += '■ 電話番号\n' + (data.phone || '未入力') + '\n\n';
    body += '■ 連絡希望\n' + (data.contactMethod || '未入力') + '\n\n';
    if (data.preferredTime) {
      body += '■ 希望連絡時間・曜日\n' + data.preferredTime + '\n\n';
    }
    body += '■ 希望職種\n' + (data.jobType || '未入力') + '\n\n';
    body += '■ 希望面接場所・形式\n' + (data.interviewType || '未入力') + '\n';
  } else {
    body += '■ お名前\n' + (data.name || '未入力') + '\n\n';
    body += '■ メールアドレス\n' + (data.email || '未入力') + '\n\n';
    body += '■ 電話番号\n' + (data.phone || '未入力') + '\n\n';
    body += '■ 連絡方法\n' + (data.contactMethod || '未入力') + '\n\n';
    body += '■ メッセージ本文\n' + (data.message || '未入力') + '\n';
  }

  body += '──────────────────────────────\n\n';
  body += '※本メールは送信専用アドレスから自動送信しています。\n';
  body += '　ご返信いただいてもお答えできない場合がございます。お急ぎの場合は下記までお電話ください。\n';
  body += '※本メールにお心当たりのない場合は、お手数ですが破棄してください。\n\n';
  body += '────────────────────────\n';
  body += 'ライフサポートあさひ\n';
  body += 'TEL: ' + AUTO_REPLY_CONFIG.tel + '\n';
  body += AUTO_REPLY_CONFIG.address + '\n';
  body += '────────────────────────\n';

  return body;
}

/**
 * メールアドレスの簡易バリデーション
 */
function isValidEmail_(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

/**
 * 個人情報保護のため、フォームデータを非公開スプレッドシートに保存
 */
const SECURE_SPREADSHEET_ID = '1nw_6scW3TQKS-GGren1Et1tRJvR40GRqyB2M2Gki9LU';

/**
 * スプレッドシートに問い合わせ履歴を記録
 * 公開用スプレッドシートではなく、指定された非公開スプレッドシートに保存する
 */
function logToSheet_(data, formType) {
  try {
    // 非公開スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(SECURE_SPREADSHEET_ID);
    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    // 保存先のシート名を決定
    // 求人フォーム -> '求人'
    // お問い合わせフォーム -> '連絡'
    const sheetName = formType === 'recruit' ? '求人' : '連絡';
    let sheet = spreadsheet.getSheetByName(sheetName);

    // シートがなければ作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // ヘッダー行を追加
      if (formType === 'recruit') {
        sheet.appendRow(['日時', '名前', 'メール', '電話番号', '連絡希望', '希望連絡時間', '希望職種', '面接形式']);
      } else {
        sheet.appendRow(['日時', '名前', 'メール', '電話番号', '連絡方法', 'メッセージ']);
      }
    }

    // データを追加
    if (formType === 'recruit') {
      sheet.appendRow([
        timestamp,
        data.name || '',
        data.email || '',
        data.phone || '',
        data.contactMethod || '',
        data.preferredTime || '',
        data.jobType || '',
        data.interviewType || ''
      ]);
    } else {
      sheet.appendRow([
        timestamp,
        data.name || '',
        data.email || '',
        data.phone || '',
        data.contactMethod || '',
        data.message || ''
      ]);
    }

  } catch (e) {
    console.warn('logToSheet_ error:', e);
    // ログ記録失敗はメール送信には影響させない
  }
}

// ========================================
// テスト用関数
// ========================================

/**
 * doPost関数のテスト用
 * GASエディタから直接実行して動作確認する
 */
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        formType: 'contact',
        name: 'テスト太郎',
        email: 'test@example.com',
        phone: '090-1234-5678',
        contactMethod: 'メール',
        message: 'テストメッセージです'
      })
    }
  };

  const result = doPost(testData);
  Logger.log('Result: ' + result.getContent());
}

/**
 * 二重送信チェック関数
 * 送信データの内容からハッシュ値を生成し、CacheServiceで重複を確認する
 * 同じ内容が5分（300秒）以内に送信された場合は true を返す
 */
function checkDuplicateSubmission_(data) {
  try {
    const cache = CacheService.getScriptCache();

    // データ内容から一意のキーを生成
    // プロパティの順序による不整合を防ぐため、キーでソートしてから文字列化
    const keys = Object.keys(data).sort();
    const sortedData = {};
    keys.forEach(key => {
      sortedData[key] = data[key];
    });
    const payloadString = JSON.stringify(sortedData);

    // MD5ハッシュを生成
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, payloadString);
    // バイト配列を16進数文字列に変換
    const hash = digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');

    const cacheKey = 'submission_' + hash;

    // キャッシュに存在するか確認
    if (cache.get(cacheKey)) {
      return true; // 重複あり
    }

    // キャッシュに保存（5分間 = 300秒）
    cache.put(cacheKey, '1', 300);
    return false; // 重複なし

  } catch (e) {
    // エラー時は安全側に倒して重複なしとする（またはログ出力）
    console.warn('checkDuplicateSubmission_ error:', e);
    return false;
  }
}
