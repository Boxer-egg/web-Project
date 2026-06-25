/**
 * Hanzi information lookup: pronunciation, strokes, radical, structure and meaning.
 * Data covers common Chinese characters used in daily reading.
 */

const HANZI_DATA = {
  一: { pinyin: 'yī', tone: 1, strokes: 1, radical: '一', structure: '独体', meanings: ['数词，最小的正整数', '表示同一', '表示满、全'] },
  二: { pinyin: 'èr', tone: 4, strokes: 2, radical: '二', structure: '独体', meanings: ['数词，一加一之和', '表示双、对'] },
  三: { pinyin: 'sān', tone: 1, strokes: 3, radical: '一', structure: '独体', meanings: ['数词，二加一之和', '表示多数'] },
  四: { pinyin: 'sì', tone: 4, strokes: 5, radical: '囗', structure: '全包围', meanings: ['数词，三加一之和', '表示四方'] },
  五: { pinyin: 'wǔ', tone: 3, strokes: 4, radical: '二', structure: '独体', meanings: ['数词，四加一之和', '古代乐谱记音符号'] },
  六: { pinyin: 'liù', tone: 4, strokes: 4, radical: '八', structure: '独体', meanings: ['数词，五加一之和', '地名用字'] },
  七: { pinyin: 'qī', tone: 1, strokes: 2, radical: '一', structure: '独体', meanings: ['数词，六加一之和', '人死后每七天一祭'] },
  八: { pinyin: 'bā', tone: 1, strokes: 2, radical: '八', structure: '独体', meanings: ['数词，七加一之和', '表示分别'] },
  九: { pinyin: 'jiǔ', tone: 3, strokes: 2, radical: '丿', structure: '独体', meanings: ['数词，八加一之和', '表示多数'] },
  十: { pinyin: 'shí', tone: 2, strokes: 2, radical: '十', structure: '独体', meanings: ['数词，九加一之和', '表示完全'] },
  人: { pinyin: 'rén', tone: 2, strokes: 2, radical: '人', structure: '独体', meanings: ['能制造和使用工具进行劳动的高等动物', '别人、他人'] },
  大: { pinyin: 'dà', tone: 4, strokes: 3, radical: '大', structure: '独体', meanings: ['在体积、面积、力量等方面超过一般', '年长、排行第一'] },
  小: { pinyin: 'xiǎo', tone: 3, strokes: 3, radical: '小', structure: '独体', meanings: ['在体积、面积、数量等方面不及一般', '短时间'] },
  中: { pinyin: 'zhōng', tone: 1, strokes: 4, radical: '丨', structure: '独体', meanings: ['中间、中心', '中国'] },
  上: { pinyin: 'shàng', tone: 4, strokes: 3, radical: '一', structure: '独体', meanings: ['位置在高处', '等级高'] },
  下: { pinyin: 'xià', tone: 4, strokes: 3, radical: '一', structure: '独体', meanings: ['位置在低处', '等级低'] },
  左: { pinyin: 'zuǒ', tone: 3, strokes: 5, radical: '工', structure: '半包围', meanings: ['面向南时靠东的一边', '偏、邪'] },
  右: { pinyin: 'yòu', tone: 4, strokes: 5, radical: '口', structure: '半包围', meanings: ['面向南时靠西的一边', '表示再重复一次'] },
  东: { pinyin: 'dōng', tone: 1, strokes: 5, radical: '一', structure: '独体', meanings: ['太阳升起的方向', '主人'] },
  西: { pinyin: 'xī', tone: 1, strokes: 6, radical: '覀', structure: '独体', meanings: ['太阳落下的方向', '西洋的简称'] },
  南: { pinyin: 'nán', tone: 2, strokes: 9, radical: '十', structure: '上下', meanings: ['清晨面向太阳时右手边的方向', '南方'] },
  北: { pinyin: 'běi', tone: 3, strokes: 5, radical: '匕', structure: '左右', meanings: ['清晨面向太阳时左手边的方向', '打败仗'] },
  天: { pinyin: 'tiān', tone: 1, strokes: 4, radical: '大', structure: '独体', meanings: ['天空', '自然界'] },
  地: { pinyin: 'dì', tone: 4, strokes: 6, radical: '土', structure: '左右', meanings: ['地球、地面', '地区'] },
  日: { pinyin: 'rì', tone: 4, strokes: 4, radical: '日', structure: '独体', meanings: ['太阳', '白天'] },
  月: { pinyin: 'yuè', tone: 4, strokes: 4, radical: '月', structure: '独体', meanings: ['月亮', '月份'] },
  水: { pinyin: 'shuǐ', tone: 3, strokes: 4, radical: '水', structure: '独体', meanings: ['无色无味透明液体', '河流'] },
  火: { pinyin: 'huǒ', tone: 3, strokes: 4, radical: '火', structure: '独体', meanings: ['物体燃烧时产生的光焰', '紧急'] },
  木: { pinyin: 'mù', tone: 4, strokes: 4, radical: '木', structure: '独体', meanings: ['树木', '木材'] },
  土: { pinyin: 'tǔ', tone: 3, strokes: 3, radical: '土', structure: '独体', meanings: ['泥土、土壤', '土地'] },
  金: { pinyin: 'jīn', tone: 1, strokes: 8, radical: '金', structure: '上下', meanings: ['金属', '黄金'] },
  明: { pinyin: 'míng', tone: 2, strokes: 8, radical: '日', structure: '左右', meanings: ['明亮', '清楚'] },
  暗: { pinyin: 'àn', tone: 4, strokes: 13, radical: '日', structure: '左右', meanings: ['光线不足', '隐藏'] },
  早: { pinyin: 'zǎo', tone: 3, strokes: 6, radical: '日', structure: '上下', meanings: ['早晨', '时间靠前'] },
  晚: { pinyin: 'wǎn', tone: 3, strokes: 11, radical: '日', structure: '左右', meanings: ['晚上', '时间靠后'] },
  春: { pinyin: 'chūn', tone: 1, strokes: 9, radical: '日', structure: '上下', meanings: ['春季', '生机'] },
  夏: { pinyin: 'xià', tone: 4, strokes: 10, radical: '夂', structure: '上下', meanings: ['夏季', '中国古称'] },
  秋: { pinyin: 'qiū', tone: 1, strokes: 9, radical: '禾', structure: '左右', meanings: ['秋季', '年'] },
  冬: { pinyin: 'dōng', tone: 1, strokes: 5, radical: '夂', structure: '上下', meanings: ['冬季', '姓'] },
  山: { pinyin: 'shān', tone: 1, strokes: 3, radical: '山', structure: '独体', meanings: ['地面形成的高耸部分', '坟'] },
  川: { pinyin: 'chuān', tone: 1, strokes: 3, radical: '川', structure: '独体', meanings: ['河流', '平地'] },
  江: { pinyin: 'jiāng', tone: 1, strokes: 6, radical: '氵', structure: '左右', meanings: ['大河', '特指长江'] },
  河: { pinyin: 'hé', tone: 2, strokes: 8, radical: '氵', structure: '左右', meanings: ['天然水道', '特指黄河'] },
  海: { pinyin: 'hǎi', tone: 3, strokes: 10, radical: '氵', structure: '左右', meanings: ['大洋靠近陆地的部分', '比喻广大'] },
  湖: { pinyin: 'hú', tone: 2, strokes: 12, radical: '氵', structure: '左右', meanings: ['陆地上聚积的大水', '地名用字'] },
  手: { pinyin: 'shǒu', tone: 3, strokes: 4, radical: '手', structure: '独体', meanings: ['人体上肢前端能拿东西的部分', '亲手'] },
  足: { pinyin: 'zú', tone: 2, strokes: 7, radical: '足', structure: '上下', meanings: ['脚', '足够'] },
  口: { pinyin: 'kǒu', tone: 3, strokes: 3, radical: '口', structure: '独体', meanings: ['人和动物吃东西的器官', '出入的通道'] },
  目: { pinyin: 'mù', tone: 4, strokes: 5, radical: '目', structure: '独体', meanings: ['眼睛', '看'] },
  耳: { pinyin: 'ěr', tone: 3, strokes: 6, radical: '耳', structure: '独体', meanings: ['耳朵', '形状像耳朵的东西'] },
  心: { pinyin: 'xīn', tone: 1, strokes: 4, radical: '心', structure: '独体', meanings: ['心脏', '思想感情'] },
  思: { pinyin: 'sī', tone: 1, strokes: 9, radical: '心', structure: '上下', meanings: ['想、考虑', '想念'] },
  想: { pinyin: 'xiǎng', tone: 3, strokes: 13, radical: '心', structure: '上下', meanings: ['思索', '希望'] },
  爱: { pinyin: 'ài', tone: 4, strokes: 10, radical: '爫', structure: '上下', meanings: ['对人或事物有深厚感情', '喜欢'] },
  好: { pinyin: 'hǎo', tone: 3, strokes: 6, radical: '女', structure: '左右', meanings: ['优点多的', '友爱'] },
  坏: { pinyin: 'huài', tone: 4, strokes: 7, radical: '土', structure: '左右', meanings: ['不好的', '破损'] },
  多: { pinyin: 'duō', tone: 1, strokes: 6, radical: '夕', structure: '上下', meanings: ['数量大', '超出'] },
  少: { pinyin: 'shǎo', tone: 3, strokes: 4, radical: '小', structure: '独体', meanings: ['数量小', '缺少'] },
  高: { pinyin: 'gāo', tone: 1, strokes: 10, radical: '高', structure: '独体', meanings: ['从底部到顶部的距离大', '等级在上'] },
  低: { pinyin: 'dī', tone: 1, strokes: 7, radical: '亻', structure: '左右', meanings: ['从下向上距离小', '等级在下'] },
  长: { pinyin: 'cháng', tone: 2, strokes: 4, radical: '长', structure: '独体', meanings: ['两点之间距离大', '时间久'] },
  短: { pinyin: 'duǎn', tone: 3, strokes: 12, radical: '矢', structure: '左右', meanings: ['长度小', '缺点'] },
  来: { pinyin: 'lái', tone: 2, strokes: 7, radical: '木', structure: '独体', meanings: ['从别处到说话人所在处', '未来'] },
  去: { pinyin: 'qù', tone: 4, strokes: 5, radical: '厶', structure: '上下', meanings: ['离开说话人所在处', '除掉'] },
  进: { pinyin: 'jìn', tone: 4, strokes: 7, radical: '辶', structure: '半包围', meanings: ['向前移动', '收入'] },
  出: { pinyin: 'chū', tone: 1, strokes: 5, radical: '凵', structure: '独体', meanings: ['从里面到外面', '产生'] },
  开: { pinyin: 'kāi', tone: 1, strokes: 4, radical: '廾', structure: '独体', meanings: ['打开', '开始'] },
  关: { pinyin: 'guān', tone: 1, strokes: 6, radical: '丷', structure: '上下', meanings: ['闭合', '牵连'] },
  生: { pinyin: 'shēng', tone: 1, strokes: 5, radical: '生', structure: '独体', meanings: ['生长', '出生'] },
  死: { pinyin: 'sǐ', tone: 3, strokes: 6, radical: '歹', structure: '左右', meanings: ['生命终结', '拼死'] },
  老: { pinyin: 'lǎo', tone: 3, strokes: 6, radical: '耂', structure: '半包围', meanings: ['年纪大', '熟练'] },
  新: { pinyin: 'xīn', tone: 1, strokes: 13, radical: '斤', structure: '左右', meanings: ['刚出现的', '没有用过的'] },
  旧: { pinyin: 'jiù', tone: 4, strokes: 5, radical: '日', structure: '左右', meanings: ['经过长时间使用', '从前'] },
  男: { pinyin: 'nán', tone: 2, strokes: 7, radical: '田', structure: '上下', meanings: ['男性', '儿子'] },
  女: { pinyin: 'nǚ', tone: 3, strokes: 3, radical: '女', structure: '独体', meanings: ['女性', '女儿'] },
  父: { pinyin: 'fù', tone: 4, strokes: 4, radical: '父', structure: '独体', meanings: ['父亲', '对男性长辈的称呼'] },
  母: { pinyin: 'mǔ', tone: 3, strokes: 5, radical: '母', structure: '独体', meanings: ['母亲', '女性长辈'] },
  子: { pinyin: 'zǐ', tone: 3, strokes: 3, radical: '子', structure: '独体', meanings: ['儿子', '幼小的'] },
  儿: { pinyin: 'ér', tone: 2, strokes: 2, radical: '儿', structure: '独体', meanings: ['小孩子', '年轻人'] },
  王: { pinyin: 'wáng', tone: 2, strokes: 4, radical: '王', structure: '独体', meanings: ['君主', '同类中最突出者'] },
  国: { pinyin: 'guó', tone: 2, strokes: 8, radical: '囗', structure: '全包围', meanings: ['国家', '都城'] },
  家: { pinyin: 'jiā', tone: 1, strokes: 10, radical: '宀', structure: '上下', meanings: ['家庭', '住所'] },
  学: { pinyin: 'xué', tone: 2, strokes: 8, radical: '子', structure: '上下', meanings: ['学习', '学校'] },
  校: { pinyin: 'xiào', tone: 4, strokes: 10, radical: '木', structure: '左右', meanings: ['学校', '校对'] },
  文: { pinyin: 'wén', tone: 2, strokes: 4, radical: '文', structure: '独体', meanings: ['文字', '文章'] },
  字: { pinyin: 'zì', tone: 4, strokes: 6, radical: '子', structure: '上下', meanings: ['文字', '名字'] },
  书: { pinyin: 'shū', tone: 1, strokes: 4, radical: '乛', structure: '独体', meanings: ['书籍', '书写'] },
  画: { pinyin: 'huà', tone: 4, strokes: 8, radical: '田', structure: '半包围', meanings: ['图画', '用笔描绘'] },
  音: { pinyin: 'yīn', tone: 1, strokes: 9, radical: '音', structure: '上下', meanings: ['声音', '消息'] },
  乐: { pinyin: 'lè', tone: 4, strokes: 5, radical: '丿', structure: '独体', meanings: ['快乐', '音乐'] },
  飞: { pinyin: 'fēi', tone: 1, strokes: 3, radical: '飞', structure: '独体', meanings: ['鸟类或昆虫鼓动翅膀在空中活动', '突然'] },
  跑: { pinyin: 'pǎo', tone: 3, strokes: 12, radical: '足', structure: '左右', meanings: ['两只脚迅速前进', '逃走'] },
  走: { pinyin: 'zǒu', tone: 3, strokes: 7, radical: '走', structure: '上下', meanings: ['步行', '离开'] },
  吃: { pinyin: 'chī', tone: 1, strokes: 6, radical: '口', structure: '左右', meanings: ['把食物放入嘴里咀嚼咽下', '承受'] },
  喝: { pinyin: 'hē', tone: 1, strokes: 12, radical: '口', structure: '左右', meanings: ['把液体咽下去', '大声喊叫'] },
  看: { pinyin: 'kàn', tone: 4, strokes: 9, radical: '目', structure: '半包围', meanings: ['使视线接触人或物', '观察'] },
  见: { pinyin: 'jiàn', tone: 4, strokes: 4, radical: '见', structure: '独体', meanings: ['看到', '会见'] },
  听: { pinyin: 'tīng', tone: 1, strokes: 7, radical: '口', structure: '左右', meanings: ['用耳朵接受声音', '听从'] },
  说: { pinyin: 'shuō', tone: 1, strokes: 9, radical: '讠', structure: '左右', meanings: ['用言语表达意思', '解释'] },
  话: { pinyin: 'huà', tone: 4, strokes: 8, radical: '讠', structure: '左右', meanings: ['言语', '说'] },
  问: { pinyin: 'wèn', tone: 4, strokes: 6, radical: '门', structure: '半包围', meanings: ['有不知道或不明白的事请人解答', '问候'] },
  答: { pinyin: 'dá', tone: 2, strokes: 12, radical: '竹', structure: '上下', meanings: ['回答', '回报'] },
  写: { pinyin: 'xiě', tone: 3, strokes: 5, radical: '冖', structure: '上下', meanings: ['用笔描摹字或画', '写作'] },
  读: { pinyin: 'dú', tone: 2, strokes: 10, radical: '讠', structure: '左右', meanings: ['看着文字念出声音', '阅读'] },
  重: { pinyin: 'zhòng', tone: 4, strokes: 9, radical: '里', structure: '独体', meanings: ['分量大', '程度深'] },
  轻: { pinyin: 'qīng', tone: 1, strokes: 9, radical: '车', structure: '左右', meanings: ['分量小', '程度浅'] },
  快: { pinyin: 'kuài', tone: 4, strokes: 7, radical: '忄', structure: '左右', meanings: ['速度高', '赶紧'] },
  慢: { pinyin: 'màn', tone: 4, strokes: 14, radical: '忄', structure: '左右', meanings: ['速度低', '态度冷淡'] },
  热: { pinyin: 'rè', tone: 4, strokes: 10, radical: '灬', structure: '上下', meanings: ['温度高', '情意深厚'] },
  冷: { pinyin: 'lěng', tone: 3, strokes: 7, radical: '冫', structure: '左右', meanings: ['温度低', '不热情'] },
  红: { pinyin: 'hóng', tone: 2, strokes: 6, radical: '纟', structure: '左右', meanings: ['像鲜血的颜色', '喜庆'] },
  绿: { pinyin: 'lǜ', tone: 4, strokes: 11, radical: '纟', structure: '左右', meanings: ['像草和树叶茂盛时的颜色', '环保'] },
  蓝: { pinyin: 'lán', tone: 2, strokes: 13, radical: '艹', structure: '上下', meanings: ['像晴天天空的颜色', '蓼蓝植物'] },
  白: { pinyin: 'bái', tone: 2, strokes: 5, radical: '白', structure: '独体', meanings: ['像雪或乳汁的颜色', '清楚'] },
  黑: { pinyin: 'hēi', tone: 1, strokes: 12, radical: '黑', structure: '上下', meanings: ['像煤或墨的颜色', '黑暗'] },
  黄: { pinyin: 'huáng', tone: 2, strokes: 11, radical: '黄', structure: '独体', meanings: ['像丝瓜花或向日葵花的颜色', '失败'] },
  花: { pinyin: 'huā', tone: 1, strokes: 7, radical: '艹', structure: '上下', meanings: ['种子植物的有性繁殖器官', '花样'] },
  草: { pinyin: 'cǎo', tone: 3, strokes: 9, radical: '艹', structure: '上下', meanings: ['草本植物', '草稿'] },
  树: { pinyin: 'shù', tone: 4, strokes: 9, radical: '木', structure: '左右', meanings: ['木本植物', '树立'] },
  林: { pinyin: 'lín', tone: 2, strokes: 8, radical: '木', structure: '左右', meanings: ['成片的树木', '林业'] },
  森: { pinyin: 'sēn', tone: 1, strokes: 12, radical: '木', structure: '品字形', meanings: ['树木茂密', '阴森'] },
  鑫: { pinyin: 'xīn', tone: 1, strokes: 24, radical: '金', structure: '品字形', meanings: ['财富兴盛，常用于人名或店名'] },
  淼: { pinyin: 'miǎo', tone: 3, strokes: 12, radical: '水', structure: '品字形', meanings: ['水势浩大，多用于人名'] },
  焱: { pinyin: 'yàn', tone: 4, strokes: 12, radical: '火', structure: '品字形', meanings: ['火花、火焰'] },
  磊: { pinyin: 'lěi', tone: 3, strokes: 15, radical: '石', structure: '品字形', meanings: ['石头多，比喻心地光明坦白'] }
}

/**
 * Look up information for a single Chinese character.
 * @param {string} char
 * @returns {{char: string, pinyin: string, tone: number, strokes: number, radical: string, structure: string, meanings: string[]}|null}
 */
export function lookupHanzi(char) {
  const input = String(char || '').trim()
  if (!/^[^\x00-\x7F]$/.test(input)) return null
  const data = HANZI_DATA[input]
  if (!data) return null
  return { char: input, ...data }
}

/**
 * Get total number of characters in the local database.
 * @returns {number}
 */
export function getHanziCount() {
  return Object.keys(HANZI_DATA).length
}

export const STRUCTURE_TYPES = ['独体', '左右', '上下', '半包围', '全包围', '品字形']
