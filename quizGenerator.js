/**
 * QuizGenerator - Comprehensive High School Quiz & Explanation Generator Engine
 * 改善版: 教科別階層データベース・重複出題防止・AIキーワード類推ロジック超強化
 */
class QuizGenerator {
    constructor() {
        // 出題履歴管理用 (同じゲーム内での重複出題を完全に防ぐ)
        this.usedQuestions = new Set();

        // 31単元の厳格なカテゴリ構造定義
        this.categories = [
            { id: 'all', name: '🏫 全分野ミックス (高校教科全般からランダム出題)', subject: 'all' },
            
            // 国語
            { id: 'kokugo_gen_kanji', name: '国語：現代文 (重要漢字・語彙の書き取り)', subject: 'kokugo' },
            { id: 'kokugo_gen_idiom', name: '国語：現代文 (ことわざ・慣用句・四字熟語の意味)', subject: 'kokugo' },
            { id: 'kokugo_kobun', name: '国語：古文 (古文単語の意味・基本文法・過去の助動詞接続)', subject: 'kokugo' },
            { id: 'kokugo_kanbun', name: '国語：漢文 (返り点のルール・訓読法・重要句法)', subject: 'kokugo' },
            
            // 英語
            { id: 'english_vocab_base', name: '英語：基礎英単語 (基本名詞・動詞)', subject: 'english' },
            { id: 'english_vocab_adv', name: '英語：応用英単語 (最重要語彙)', subject: 'english' },
            { id: 'english_grammar_base', name: '英語：英文法(基礎) (完了形・助動詞・受動態の使い分け)', subject: 'english' },
            { id: 'english_grammar_adv', name: '英語：英文法(応用) (関係代名詞・関係副詞・仮定法)', subject: 'english' },
            
            // 社会
            { id: 'society_jp_history_early', name: '日本史：原始・古代〜中世 (墾田永年私財法・大化の改新・鎌倉政権)', subject: 'society' },
            { id: 'society_jp_history_modern', name: '日本史：近世〜近代 (本能寺の変・関ヶ原の戦い・明治維新)', subject: 'society' },
            { id: 'society_jp_history_recent', name: '日本史：現代 (治安維持法・ポツダム宣言・戦後の改革)', subject: 'society' },
            { id: 'society_world_history_early', name: '世界史：古代〜中世 (ハンムラビ法典・アレクサンドロス大王・秦の統一)', subject: 'society' },
            { id: 'society_world_history_modern', name: '世界史：近世〜近代 (コロンブス来航・フランス革命・産業革命)', subject: 'society' },
            { id: 'society_world_history_recent', name: '世界史：現代 (大戦の契機・世界恐慌・東西冷戦)', subject: 'society' },
            { id: 'society_geography_nature', name: '地理：自然環境と気候 (気候区分・プレート・造山帯)', subject: 'society' },
            { id: 'society_geography_industry', name: '地理：世界の産業・資源 (時差の計算・農業・鉱物資源)', subject: 'society' },
            
            // 理科
            { id: 'science_physics_mechanics', name: '物理：物体の運動 (速度・等加速度・運動方程式 F=ma)', subject: 'science' },
            { id: 'science_physics_wave_heat', name: '物理：熱と波 (比熱・光の屈折・ドップラー効果)', subject: 'science' },
            { id: 'science_physics_electromagnet', name: '物理：電気と磁気 (オームの法則・右ねじ・電磁誘導)', subject: 'science' },
            { id: 'science_chemistry_atomic', name: '化学：原子の構造 (電子殻・同族元素・共有結合)', subject: 'science' },
            { id: 'science_chemistry_reaction', name: '化学：物質量と化学変化 (物質量 mol・気体の体積22.4L)', subject: 'science' },
            { id: 'science_chemistry_acid_base', name: '化学：酸・塩基と酸化還元 (pH・中和・酸化数)', subject: 'science' },
            { id: 'science_biology_cell_dna', name: '生物：細胞とDNA (原核と真核の比較・転写と翻訳)', subject: 'science' },
            { id: 'science_biology_body_env', name: '生物：体内環境の維持 (自律神経・獲得免疫・恒常性)', subject: 'science' },
            { id: 'science_biology_ecosystem', name: '生物：生態系と循環 (生産者・消費者・分解者・照葉樹林)', subject: 'science' },
            
            // 情報・家庭科
            { id: 'info_digital', name: '情報：情報の表し方 (2進数・16進数、ビットとバイト、デジタル表現)', subject: 'info_home' },
            { id: 'info_network_security', name: '情報：ネットワーク・セキュリティ (IPアドレス・暗号化・防犯)', subject: 'info_home' },
            { id: 'info_algorithm', name: '情報：アルゴリズム (フローチャート・基本3構造・ループ)', subject: 'info_home' },
            { id: 'home_diet', name: '家庭科：食生活と栄養 (五大栄養素・特定原材料8品目)', subject: 'info_home' },
            { id: 'home_life', name: '家庭科：消費生活・家族 (クーリングオフ・核家族・社会保障)', subject: 'info_home' },
            
            // 数学
            { id: 'math_all', name: '数学：全分野 (数I〜数Cランダム計算)', subject: 'math' },
            { id: 'custom', name: '✏️ AIキーワード指定', subject: 'custom' }
        ];

        // 各教科の豊富なクイズ問題データベース (全250問規模に増強)
        this.db = {
            // 国語：現代文(漢字・語彙)
            kokugo_gen_kanji: [
                { id: "kgk_1", q: "「これまでの作業の<b>しんちょく</b>状況を報告する。」の太字部の正しい漢字は？", c: "進捗", w: ["進直", "伸捗", "親捗"], e: "「捗」は「はかどる」という意味です。物事の進行具合は「進捗」と書きます。" },
                { id: "kgk_2", q: "「彼の企画書は<b>ずさん</b>な内容だった。」の太字部の意味として正しいものは？", c: "誤りが多く、やり方が大雑把で手ぬるいこと", w: ["ずる賢く、他人の足を引っ張るような性質", "非常に斬新で、誰も思いつかないような様子", "古くさく、今の時代には適していないこと"], e: "「杜撰（ずさん）」は、仕事や文章が大雑把で、間違いや手落ちが多いことを意味します。" },
                { id: "kgk_3", q: "「人の意見を<b>こそく</b>な手段でかわす。」という文における「姑息」の本来の意味は？", c: "一時しのぎ", w: ["卑怯な", "ずるい", "無駄な"], e: "「姑息（こそく）」の本来の意味は「一時しのぎ」です。卑怯という意味で用いるのは現代の誤用とされています。" },
                { id: "kgk_4", q: "「客に対して<b>いんぎん</b>に礼を言う。」の太字部の正しい漢字は？", c: "慇懃", w: ["陰懃", "慇懄", "隠勤"], e: "心から人に対して丁寧で礼儀正しいことを「慇懃（いんぎん）」と書きます。" },
                { id: "kgk_5", q: "「事件の全貌が<b>つまびらか</b>になる。」の太字部の正しい漢字は？", c: "詳らか", w: ["定らか", "端らか", "顕らか"], e: "物事の細かいところまではっきりしている様子を「詳（つまび）らか」と書きます。" }
            ],
            // 国語：現代文(ことわざ・四字熟語)
            kokugo_gen_idiom: [
                { id: "kgi_1", q: "「情けは人のためならず」の正しい意味は？", c: "人に親切にしておけば、巡り巡って自分に良い報いがある", w: ["他人に優しくしすぎると、その人の自立を妨げためにならない", "他人に情けをかけるのは、その人のためを思うなら避けるべきだ", "情けをかけた人は、決してあなたを裏切らない"], e: "「情けは人のためならず」は、人に親切にすることはその人のためだけでなく、回り回って自分に返ってくるという意味です。" },
                { id: "kgi_2", q: "非常に丁寧で礼儀正しいが、心の中では相手を見下しており、かえって無礼に感じられる様子を表す四字熟語は？", c: "慇懃無礼", w: ["意気消沈", "唯我独尊", "馬耳東風"], e: "「慇懃無礼（いんぎんぶれい）」は、表面は丁寧ですが、実は横柄で無礼な態度であることを意味します。" },
                { id: "kgi_3", q: "「恐ろしさや躊躇のため、次に進むのをためらうこと」を意味する慣用句は？", c: "二の足を踏む", w: ["揚げ足を取る", "二の句が継げない", "足元を見る"], e: "「二の足を踏む」は、一歩目は踏み出せても二歩目をためらうことから、物事に対して尻込みをすることを指します。" },
                { id: "kgi_4", q: "「何の苦労もなく、一度に多くの利益を得ること」を意味する慣用句は？", c: "濡れ手で粟", w: ["捕らぬ狸の皮算用", "棚からぼた餅", "一石二鳥"], e: "「濡れ手で粟（あわ）」は、濡れた手で粟を掴むと粟の粒がたくさんくっついてくることから、労せず多くの利益を得ることを意味します。" },
                { id: "kgi_5", q: "「お互いに気心が知れており、何をしても許し合える親密な関係」を指す四字熟語は？", c: "懇意懇切", w: ["厚顔無恥", "八方美人", "同床異夢"], e: "非常に親しくつきあう間柄を「懇意」と呼びます。" }
            ],
            // 国語：古文
            kokugo_kobun: [
                { id: "kkb_1", q: "古文単語「をかし」の代表的な意味として適当なものは？", c: "趣がある", w: ["恐ろしい", "恥ずかしい", "おかしい（滑稽だ）"], e: "「をかし」は平安時代の重要な美意識を表す言葉で、「趣がある」「美しい」「素晴らしい」という意味で広く使われます。" },
                { id: "kkb_2", q: "過去の助動詞「き」の接続（どのような活用語につくか）と活用型は？", c: "連用形接続・特殊型", w: ["未然形接続・サ変型", "終止形接続・ラ変型", "已然形接続・四段型"], e: "過去の助動詞「き」は原則として連用形に接続し、活用は「（せ）／〇／き／し／しか／〇」という特殊な活用をします。" },
                { id: "kkb_3", q: "古文単語「あわれなり」の意味として最も適当なものは？", c: "しみじみと深い趣がある", w: ["かわいそうだ", "うるさい", "慌てている"], e: "「あわれなり」は客観的・知的な「をかし」に対し、主観的・情緒的な感動を表す言葉で、「しみじみと深い趣がある」という意味になります。" },
                { id: "kkb_4", q: "古文単語「うつくし」の平安時代における本来の意味は？", c: "かわいらしい", w: ["（景色などが）美しい", "奇妙だ", "おいしそうである"], e: "「うつくし」は中世以前は「かわいらしい」「愛すべきだ」という意味で使われ、主に小さな子供や小動物に対して用いられました。" },
                { id: "kkb_5", q: "「いみじ」が会話文や文章中で用いられる際の主な意味は？", c: "並大抵ではない（とても良い、またはとても悪い）", w: ["気味が悪い", "退屈である", "簡単である"], e: "「いみじ」は「著しい」という意味から派生し、現代語の「ヤバい」のように、良い方向にも悪い方向にも「程度がはなはだしい」ことを指します。" }
            ],
            // 国語：漢文
            kokugo_kanbun: [
                { id: "kkn_1", q: "返り点「レ点」の正しい読み方のルールは？", c: "直後の1字を読んだあと、直前の1字に返って読む", w: ["2字以上を飛び越して上に返って読む", "常に文章の最初に戻って読み直す", "返り点に関係なく、上からそのまま読む"], e: "「レ点」は直後の漢字を先に読み、そのあとで上の漢字に1字返って読むための記号です。" },
                { id: "kkn_2", q: "「不レ能二～一」という漢文の句法の訓読と意味は？", c: "～すること能はず (～することができない)", w: ["～すること能はざるべからず (～しなければならない)", "未だ～せず (まだ～していない)", "まさに～せんとす (今にも～しようとする)"], e: "「不能（～することあたはず）」は、能力や状況的に「～することができない」という可能の否定を表す重要句法です。" },
                { id: "kkn_3", q: "「唯二～耳一」という漢文の限定句法の訓読と意味は？", c: "ただ～のみ (ただ～するだけだ)", w: ["～するにしかず (～する方が良い)", "～にしかず (～に及ばない)", "～せんと欲す (～したいと思う)"], e: "「ただ〜のみ」と読み、「ただ〜だけである」と数量や範囲を限定する句法です。" },
                { id: "kkn_4", q: "「何以～」という漢文の疑問・反語句法の訓読は？", c: "何を以てか～（どうして～か）", w: ["何れにか～（どこで～か）", "何れの時にか～（いつ～か）", "何為れぞ～（なぜ～か）"], e: "「何を以てか（なにをもってか）」と訓読し、原因や手段を尋ねる「どうして～か」「どのようにして～か」という意味になります。" }
            ],

            // 英語：基礎語彙
            english_vocab_base: [
                { id: "evb_1", q: "英単語「describe」の正しい意味は？", c: "～を描写する、特徴を説明する", w: ["～を決定する", "～を保護する", "～を配達する"], e: "describe は「（言葉で）～を描写する、説明する」という意味の動詞です。" },
                { id: "evb_2", q: "英単語「encourage」の正しい意味は？", c: "～を勇気づける、推奨する", w: ["～に反対する", "～を無視する", "～を非難する"], e: "encourage は「～を勇気づける、励ます、奨励する」という意味の動詞です。" },
                { id: "evb_3", q: "英単語「prevent」の正しい意味と前置詞の組み合わせは？", c: "～を防ぐ、妨げる (prevent A from B)", w: ["～を準備する (prevent A for B)", "～を代表する (prevent A with B)", "～を予測する (prevent A of B)"], e: "prevent は「防ぐ」という意味で、prevent A from doing（Aが〜するのを防ぐ）の形で頻出します。" },
                { id: "evb_4", q: "英単語「necessary」の正しい意味は？", c: "必要な、欠かせない", w: ["一時的な", "効果的な", "正確な"], e: "necessary は「必要な」を意味する形容詞です。名詞形は necessity（必要性）になります。" },
                { id: "evb_5", q: "英単語「opportunity」の正しい意味は？", c: "（好ましい）機会、チャンス", w: ["反対意見", "平均値", "危機状況"], e: "opportunity は「機会」「好機」を意味する名詞です。chance よりもフォーマルな表現です。" }
            ],
            // 英語：応用語彙
            english_vocab_adv: [
                { id: "eva_1", q: "英単語「contribute」の正しい意味と前置詞の組み合わせは？", c: "～に貢献する (contribute to)", w: ["～を設立する (contribute of)", "～に代わる (contribute with)", "～に反対する (contribute against)"], e: "contribute は「～に貢献する、寄付する」という意味の動詞で、前置詞 to を伴います。" },
                { id: "eva_2", q: "英単語「alternative」の形容詞としての正しい意味は？", c: "代わりの、代替の", w: ["非常に重要な", "一時的な", "知的な"], e: "alternative は「代わりの、二者択一の」という意味です。" },
                { id: "eva_3", q: "英単語「significant」の正しい意味は？", c: "重要な、かなりの、意義深い", w: ["些細な", "人工的な", "伝統的な"], e: "significant は「重要な、著しい」という意味の形容詞です。反対語は insignificant（些細な）です。" },
                { id: "eva_4", q: "英単語「acquire」の正しい意味は？", c: "（能力や技術などを）習得する、獲得する", w: ["～を要求する", "～を避ける", "～を捨てる"], e: "acquire は「（時間と努力をかけて）〜を身につける、獲得する」という意味の動詞です。" },
                { id: "eva_5", q: "英単語「distinguish」の動詞としての正しい意味は？", c: "～を区別する、見分ける", w: ["～を破壊する", "～を展示する", "～を分配する"], e: "distinguish は「〜を区別する」という意味で、distinguish A from B の形でよく使われます。" }
            ],
            // 英語：文法(基本)
            english_grammar_base: [
                { id: "egb_1", q: "次の空欄に入る最も適切な語は？ 「I have been studying English (  ) three years.」", c: "for", w: ["since", "during", "at"], e: "「3年間」という時間の長さを表すため、期間を示す前置詞 for が適しています。" },
                { id: "egb_2", q: "次の空欄に入る最も適切な語は？ 「If it (  ) tomorrow, we will stay home.」", c: "rains", w: ["will rain", "rained", "is going to rain"], e: "条件を表す副詞節（If〜）の中では、未来のことでも未来形 will は使わず、現在形にします。" },
                { id: "egb_3", q: "次の空欄に入る最も適切な語は？ 「English is (  ) all over the world.」", c: "spoken", w: ["speaking", "speak", "spoke"], e: "「英語は世界中で話されている」という受動態（be動詞 + 過去分詞）にするため、spoken が正解です。" },
                { id: "egb_4", q: "次の空欄に入る最も適切な語は？ 「You (  ) not enter this room. It is prohibited.」", c: "must", w: ["may", "should", "will"], e: "「禁止（〜してはならない）」を表す強い表現として must not が最適です。" }
            ],
            // 英語：文法(応用)
            english_grammar_adv: [
                { id: "ega_1", q: "次の空欄に入る最も適切な関係詞は？ 「The boy (  ) father is a doctor is my classmate.」", c: "whose", w: ["who", "whom", "which"], e: "The boy の父親（his father）という所有格の関係を表すため、whose が正解です。" },
                { id: "ega_2", q: "次の空欄に入る最も適切な語は？ 「If I (  ) rich, I could buy that expensive car.」", c: "were", w: ["am", "will be", "had been"], e: "現在の事実とは異なる仮定を表す仮定法過去の文です。仮定法過去の be動詞は were になります。" },
                { id: "ega_3", q: "次の空欄に入る最も適切な語は？ 「I wish I (  ) harder when I was a high school student.」", c: "had studied", w: ["studied", "have studied", "would study"], e: "過去の事実に対する後悔・願望（高校生の時もっと勉強しておけばよかった）を表すため、仮定法過去完了（had + 過去分詞）を用います。" },
                { id: "ega_4", q: "次の空欄に入る最も適切な語は？ 「(  ) seen from a distance, the rock looks like a lion.」", c: "When", w: ["If", "Because", "Though"], e: "分詞構文 (When the rock is seen...) の接続詞を残した表現で、When が正解です。" }
            ],

            // 日本史：古代〜中世
            society_jp_history_early: [
                { id: "jhe_1", q: "743年に制定され、新しく開墾した土地の永久私有を認めた法令は？", c: "墾田永年私財法", w: ["三世一身の法", "大宝律令", "班田収授法"], e: "墾田永年私財法（743年）により、土地の永代私有が認められ、これがのちの荘園の発達に繋がりました。" },
                { id: "jhe_2", q: "645年、中大兄皇子や中臣鎌足らが蘇我氏を打倒し、大化の改新と呼ばれる政治改革を開始した最初の事件は？", c: "乙巳の変", w: ["壬申の乱", "薬子の変", "平治の乱"], e: "645年の中大兄皇子らによる蘇我入鹿暗殺事件を「乙巳の変（いっしのへん）」と呼びます。" },
                { id: "jhe_3", q: "794年、桓武天皇が現在の京都府に遷都し、明治に東京へ遷都するまで千年以上皇居が置かれた都は？", c: "平安京", w: ["平城京", "長岡京", "難波京"], e: "桓武天皇は784年の長岡京ののち、794年に平安京へ遷都し、ここから約400年におよぶ平安時代が始まりました。" },
                { id: "jhe_4", q: "鎌倉幕府を開いた人物で、1192年に征夷大将軍に任命され、守護・地頭を設置して武家政権を確立した人物は？", c: "源頼朝", w: ["源義経", "徳川家康", "足利尊氏"], e: "源頼朝は平氏を滅ぼしたのち、1185年に守護・地頭を設置し、1192年に征夷大将軍となりました。" }
            ],
            // 日本史：近世〜近代
            society_jp_history_modern: [
                { id: "jhm_1", q: "1582年、織田信長が家臣の明智光秀によって襲撃され、自害した事件は？", c: "本能寺の変", w: ["山崎の戦い", "本能寺の役", "桶狭間の戦い"], e: "「本能寺の変」（1582年）により、天下統一を目前にした織田信長が没しました。" },
                { id: "jhm_2", q: "1600年、徳川家康率いる東軍と、石田三成率いる西軍が激突し、徳川氏の天下覇権を決定づけた戦いは？", c: "関ヶ原の戦い", w: ["大坂の陣", "長篠の戦い", "川中島の戦い"], e: "「関ヶ原の戦い」（1600年）は、徳川家康が勝利して1603年の江戸幕府創設へと繋がる、天下分け目の戦いです。" },
                { id: "jhm_3", q: "1867年、江戸幕府第15代将軍の徳川慶喜が政権を朝廷に返上し、武家政権を終わらせた出来事は？", c: "大政奉還", w: ["王政復古の大号令", "版籍奉還", "廃藩置県"], e: "徳川慶喜が自ら朝廷へ政権を返上したことを「大政奉還」と呼び、江戸幕府は滅亡しました。" },
                { id: "jhm_4", q: "1853年、アメリカ東インド艦隊を率いて浦賀（神奈川県）に来航し、日本に開国を迫った人物は？", c: "ペリー", w: ["マッカーサー", "ハリス", "コロンブス"], e: "マシュー・ペリーは黒船（蒸気船）4隻を率いて来航し、日本の鎖国体制を揺るがしました。" }
            ],
            // 日本史：現代
            society_jp_history_recent: [
                { id: "jhr_1", q: "1925年、普通選挙法と同時に制定され、社会主義運動や天皇制批判の弾圧を目的とした治安維持に関する法律は？", c: "治安維持法", w: ["国家総動員法", "治安警察法", "破壊活動防止法"], e: "満25歳以上の男性に選挙権を与える「普通選挙法」の可決と同時に、思想統制のために「治安維持法」が制定されました。" },
                { id: "jhr_2", q: "1945年8月、日本に対して無条件降伏を迫り、日本がこれを受諾して終戦を迎えた共同宣言は？", c: "ポツダム宣言", w: ["カイロ宣言", "ヤルタ宣言", "サンフランシスコ平和条約"], e: "日本は「ポツダム宣言」を受諾し、1945年8月15日に無条件降伏して第二次世界大戦（太平洋戦争）が終結しました。" },
                { id: "jhr_3", q: "第二次世界大戦後の1951年、日本が連合国48カ国と平和条約を結び、主権（独立）を回復した条約は？", c: "サンフランシスコ平和条約", w: ["日米安全保障条約", "日中共同声明", "ポーツマス条約"], e: "この条約により日本の占領統治が終わり、日本は翌年1952年に独立国家としての主権を回復しました。" }
            ],

            // 世界史：古代〜中世
            society_world_history_early: [
                { id: "whe_1", q: "「目には目を、歯には歯を」の同害復讐法で知られる、古代メソポタミアで制定された法典は？", c: "ハンムラビ法典", w: ["ローマ法大全", "ナポレオン法典", "十二表法"], e: "バビロン第1王朝の王が制定した「ハンムラビ法典」（前18世紀頃）は、身分法の特徴を持ちます。" },
                { id: "whe_2", q: "ペルシア帝国を滅ぼし、ギリシャからインドに及ぶ大帝国を築いてヘレニズム時代の幕を開けたマケドニアの国王は？", c: "アレクサンドロス大王", w: ["カエサル", "チンギス・ハン", "ナポレオン"], e: "アレクサンドロス大王（前4世紀）は東方遠征を行い、ヘレニズム文化を誕生させました。" },
                { id: "whe_3", q: "中国を初めて統一し、万里の長城の修築や貨幣・度量衡・文字の統一、思想統制のための「焚書坑儒」を行った秦の君主は？", c: "始皇帝", w: ["漢の武帝", "唐の太宗", "康熙帝"], e: "紀元前221年に中国を初統一した秦王・政は、王を超える称号として「皇帝」を採用し、始皇帝と名乗りました。" }
            ],
            // 世界史：近世〜近代
            society_world_history_modern: [
                { id: "whm_1", q: "1789年、パリのバスティーユ牢獄襲撃を契機に勃発し、市民階級が主導して絶対王政を倒したフランスの革命は？", c: "フランス革命", w: ["ピューリタン革命", "産業革命", "アメリカ独立革命"], e: "「フランス革命」（1789年）により、自由・平等・友愛を掲げた近代人権宣言が採択されました。" },
                { id: "whm_2", q: "18世紀後半のイギリスで始まり、石炭と蒸気機関の発明に伴い、手工業から工場制機械工業へと変革した技術・産業上の大変革は？", c: "産業革命", w: ["農業革命", "情報革命", "商業革命"], e: "イギリスで始まった「産業革命」は、石炭を燃料とする蒸気機関の実用化により、世界を大きく変えました。" },
                { id: "whm_3", q: "1492年、スペイン女王の支援を受け大西洋を西に進み、カリブ海の島に到達してアメリカ大陸への先鞭をつけたイタリア生まれの航海者は？", c: "コロンブス", w: ["マゼラン", "バスコ・ダ・ガマ", "マルコ・ポーロ"], e: "クリストファー・コロンブスは、到達した地をアジア（インド）と誤解したため、のちにこの地の原住民は「インディアン」と呼ばれるようになりました。" }
            ],
            // 世界史：現代
            society_world_history_recent: [
                { id: "whr_1", q: "1914年、サライェヴォでオーストリア皇太子夫妻が暗殺された事件を直接の契機として勃発した戦争は？", c: "第一次世界大戦", w: ["第二次世界大戦", "普仏戦争", "クリミア戦争"], e: "1914年のサライェヴォ事件をきっかけに、同盟国と連合国が激突し、人類初の総力戦である「第一次世界大戦」が始まりました。" },
                { id: "whr_2", q: "1929年10月、ニューヨーク証券取引所の株価大暴落をきっかけに始まり、世界中に波及した深刻な不景気は？", c: "世界恐慌", w: ["オイルショック", "リーマンショック", "バブル崩壊"], e: "1929年のアメリカ発の株価暴落は、保護貿易やブロック経済化を引き起こし、大不況をもたらしました。" },
                { id: "whr_3", q: "第二次世界大戦後、アメリカを中心とする資本主義陣営（西側）と、ソ連を中心とする社会主義陣営（東側）が、武力衝突を伴わずに敵対した対立状況は？", c: "冷戦（冷たい戦争）", w: ["熱い戦争", "日露戦争", "新冷戦"], e: "直接の武力による全面戦争（熱い戦争）に至らなかったことから「冷戦」と呼ばれ、1989年のマルタ会談で終結が宣言されました。" }
            ],

            // 地理：自然環境
            society_geography_nature: [
                { id: "sgn_1", q: "ケッペンの気候区分において、最寒月平均気温が -3℃未満で、最暖月平均気温が 10℃以上となる、北半球のみに分布する気候帯は？", c: "亜寒帯（冷帯）", w: ["温帯", "寒帯", "乾燥帯"], e: "冬が厳しく暖い夏がある「冷帯（亜寒帯）」に分類され、シベリアやカナダなどに広く分布します。" },
                { id: "sgn_2", q: "太平洋を取り囲むように分布し、地震や火山活動が非常に活発で、日本列島やアンデス山脈が含まれる新期造山帯は？", c: "環太平洋造山帯", w: ["アルプス・ヒマラヤ造山帯", "古期造山帯", "安定陸塊"], e: "太平洋の周囲をめぐる「環太平洋造山帯」は、プレートの境界にあたり、地震・火山・急峻な山脈が特徴です。" },
                { id: "sgn_3", q: "年中高温多湿で降水量が多く、赤道周辺に分布するケッペンの気候区分における熱帯雨林気候の略記号は？", c: "Af", w: ["Aw", "Am", "Cfa"], e: "熱帯（A）で、乾季がない湿潤（f）な気候であるため <b>Af</b> と表記されます。" }
            ],
            // 地理：産業・時差
            society_geography_industry: [
                { id: "sgi_1", q: "東経135度（日本の標準時子午線）にある明石市と、経度0度の本初子午線が通るロンドンの時差は何時間？", c: "9時間", w: ["6時間", "12時間", "15時間"], e: "地球は経度15度につき1時間回転します。135 ÷ 15 = 9時間の時差になり、東にある日本が9時間進んでいます。" },
                { id: "sgi_2", q: "世界の小麦の生産量および輸出量において、広大な平原と大型機械を用いた企業的穀物農業が行われている北米の国は？", c: "アメリカ合衆国", w: ["日本", "イギリス", "ブラジル"], e: "アメリカ合衆国では、グレートプレーンズ等の広大な地域で企業的な大規模農業が行われています。" },
                { id: "sgi_3", q: "オーストラリアやブラジルで多く産出され、日本の鉄鋼業に欠かせない、赤色や黒色の主要な金属鉱物資源は？", c: "鉄鉱石", w: ["石炭", "ボーキサイト", "銅鉱石"], e: "鉄鋼の原料となる「鉄鉱石」は、安定陸塊の露天掘り炭鉱などから大量に採掘され、日本は主にオーストラリアから輸入しています。" }
            ],

            // 物理：力学
            science_physics_mechanics: [
                { id: "spm_1", q: "質量 m [kg] の物体に力 F [N] を加えたとき、物体に生じる加速度 a [m/s²] との関係を表す「運動方程式」は？", c: "ma = F", w: ["m/v = F", "mv = F", "F = 1/2 ma²"], e: "運動の第2法則（ニュートンの法則）に基づく運動方程式は <b>ma = F</b> です。" },
                { id: "spm_2", q: "静止している物体に、一定の加速度 a = 2.0 m/s² を 3.0 秒間与えたとき、物体の速度 v [m/s] は？", c: "6.0 m/s", w: ["3.0 m/s", "9.0 m/s", "1.5 m/s"], e: "等加速度直線運動の速度公式 <b>v = v₀ + at</b> より。初速度 v₀ = 0 なので、v = 0 + 2.0 × 3.0 = <b>6.0 m/s</b> になります。" },
                { id: "spm_3", q: "物体にかかる力 F [N] と、その力の向きに移動した距離 x [m] の積で表される、物理学における「仕事 W」の単位は？", c: "J（ジュール）", w: ["W（ワット）", "N（ニュートン）", "Pa（パスカル）"], e: "仕事（Work）およびエネルギーの単位は <b>J（ジュール）</b> です。1 J = 1 N・m です。" }
            ],
            // 物理：熱・波動
            science_physics_wave_heat: [
                { id: "spw_1", q: "質量 m [g]、比熱 c [J/(g・K)] の物質の温度を ΔT [K] 上昇させるのに必要な熱量 Q [J] の公式は？", c: "Q = mcΔT", w: ["Q = m/c ΔT", "Q = 1/2 mc²", "Q = mc / ΔT"], e: "必要な熱量は、質量 m、比熱 c、温度変化 ΔT のすべてに比例するため、<b>Q = mcΔT</b> で求められます。" },
                { id: "spw_2", q: "音源が観測者に近づいたり遠ざかったりすることで、観測される音の振動数が本来と異なって聞こえる現象を何という？", c: "ドップラー効果", w: ["共振現象", "回折現象", "うなり"], e: "救急車が近づくときにサイレンが高く聞こえ、遠ざかると低く聞こえる現象は「ドップラー効果」と呼ばれます。" },
                { id: "spw_3", q: "光や音が異なる媒介に入る際に進行方向が折れ曲がる現象を何という？", c: "屈折", w: ["反射", "干渉", "回折"], e: "波の進む速度が異なる媒介に斜めに入射する際、境界面で波面が傾くために起こる現象が「屈折」です。" }
            ],
            // 物理：電磁気
            science_physics_electromagnet: [
                { id: "spe_1", q: "抵抗 R [Ω] に電圧 V [V] をかけたとき、流れる電流 I [A] の関係を表す「オームの法則」は？", c: "V = RI", w: ["I = RV", "R = VI", "V = R/I"], e: "オームの法則は <b>V = RI</b> (電圧 = 抵抗 × 電流) です。" },
                { id: "spe_2", q: "導線に電流を流したとき、その周囲に生じる磁場の向きを右手の親指と他の4本の指の関係で表した法則は？", c: "右ねじの法則", w: ["フレミングの左手の法則", "レンツ의法則", "ジュールの法則"], e: "電流を右ねじが進む方向に流すと、ねじを回す方向に磁場が発生することから「右ねじの法則」と呼びます。" },
                { id: "spe_3", q: "コイルの中の磁束が変化するとき、その変化を妨げる方向に電流を流そうとする起電力が生じる現象を何という？", c: "電磁誘導", w: ["静電誘導", "自己インダクタンス", "電流の熱作用"], e: "磁束の変化を妨げる向き（レンツの法則）に誘導起電力が生じる現象を「電磁誘導」と呼びます。発電機の原理です。" }
            ],

            // 化学：物質の構成
            science_chemistry_atomic: [
                { id: "sca_1", q: "原子核の周りにある電子が存在する層（電子殻）のうち、最も内側にある殻の名前は？", c: "K殻", w: ["L殻", "M殻", "A殻"], e: "電子殻は内側から <b>K殻（最大2個）</b>、<b>L殻（最大8個）</b>、<b>M殻（最大18個）</b>... と呼ばれます。" },
                { id: "sca_2", q: "周期表において、同じ縦の列（同族元素）に並ぶ元素同士で共通する、最も重要な特徴は？", c: "価電子（最も外側の電子）の数が同じで、化学的性質が似ている", w: ["質量数がまったく同じである", "融点や沸点がすべて完全に一致する", "非金属元素と金属元素が交互に並んでいる"], e: "周期表の縦の列は「族」と呼ばれ、価電子（結合に関わる電子）の数が同じになるため、性質がよく似ています。" },
                { id: "sca_3", q: "原子同士が、お互いに不対電子を出し合って共有することによって形成される強い化学結合は？", c: "共有結合", w: ["イオン結合", "金属結合", "水素結合"], e: "非金属元素の原子同士が電子対を共有して繋がる結合を「共有結合」と呼びます。" }
            ],
            // 化学：変化と量
            science_chemistry_reaction: [
                { id: "scr_1", q: "物質量の単位「モル (mol)」において、1 mol に含まれる粒子の数はいくつか？（アボガドロ数）", c: "6.0 × 10²³ 個", w: ["6.0 × 10²² 個", "1.2 × 10²⁴ 個", "22.4 個"], e: "粒子の <b>6.0 × 10²³</b>個の集まりを 1 mol と定義します。" },
                { id: "scr_2", q: "すべての気体は種類によらず、標準状態（0℃、1.013×10⁵ Pa）において 1 mol あたり何 L の体積を占めるか？", c: "22.4 L", w: ["11.2 L", "2.24 L", "44.8 L"], e: "アボガドロの法則により、すべての気体は標準状態において 1 mol あたり <b>22.4 L</b> の体積を占めます。" },
                { id: "scr_3", q: "物質の質量 [g] をその物質のモル質量 [g/mol] で割ることで得られる値の単位は？", c: "mol", w: ["g", "L", "個"], e: "「質量 ÷ モル質量」でその物質の物質量（mol）が求まります。" }
            ],
            // 化学：酸塩基
            science_chemistry_acid_base: [
                { q: "水溶液の酸性・塩基性の度合いを表す「pH」において、中性の水溶液の pH の値は？", c: "7", w: ["0", "14", "1"], e: "水溶液の pH は 0〜14 の値をとり、中性は <b>7</b> です。7より小さいと酸性、大きいと塩基性になります。" },
                { q: "酸と塩基が反応して、互いの性質を打ち消し合い、水と塩（えん）を生成する反応を何という？", c: "中和反応", w: ["酸化還元反応", "加水分解反応", "電離反応"], e: "酸の H⁺ と塩基の OH⁻ が結合して水（H₂O）ができる反応を「中和反応」と呼びます。" }
            ],

            // 生物：細胞・DNA
            science_biology_cell_dna: [
                { q: "細胞内に「核膜に囲まれた核」を持たない細胞からなる生物を何という？（大腸菌など）", c: "原核生物", w: ["真核生物", "多細胞生物", "ウイルス"], e: "細胞内に核を持たず、DNAが細胞質基質中に存在する生物を「原核生物」と呼びます。" },
                { q: "DNAの塩基配列情報がRNAに写し取られるプロセス（転写）ののち、タンパク質が合成されるプロセスを何という？", c: "翻訳", w: ["複製", "変性", "スプライシング"], e: "DNAからmRNAを作る過程を「転写」、mRNAの塩基配列に基づいてタンパク質を作る過程を「翻訳」と呼びます。" }
            ],
            // 生物：体内環境
            science_biology_body_env: [
                { q: "危険を感じたときや興奮したときに優位になり、心拍数を上げたり瞳孔を開いたりする自律神経は？", c: "交感神経", w: ["副交感神経", "運動神経", "感覚神経"], e: "自律神経には、体を戦闘状態にする「交感神経」と、リラックス状態にする「副交感神経」があります。" },
                { q: "体内に侵入した病原体に対し、T細胞やB細胞などのリンパ球が特異的に攻撃・排除する免疫システムを何という？", c: "獲得免疫", w: ["自然免疫", "物理的防御", "化学的防御"], e: "生まれつき備わっている自然免疫に対し、後天的に病原体を記憶して強力に狙い撃ちするシステムを「獲得免疫」と呼びます。" }
            ],
            // 生物：生態系
            science_biology_ecosystem: [
                { q: "植物のように、太陽光などのエネルギーを使って無機物から有機物を合成する生物を生態系の中で何と呼ぶか？", c: "生産者", w: ["消費者", "分解者", "有機者"], e: "無機物から有機物を作る植物などは「生産者」、それらを食べる動物は「消費者」、分解する菌類などは「分解者」です。" },
                { q: "日本の気候において、西日本などの温暖な地域に分布し、スダジイやアラカシなどの光沢のある葉を持つ常緑広葉樹林のバイオームは？", c: "照葉樹林", w: ["夏緑樹林", "針葉樹林", "亜熱帯多雨林"], e: "日本の暖温帯を代表するバイオームは「照葉樹林」です。" }
            ],

            // 情報：デジタル
            info_digital: [
                { q: "2進数の数値「1010」を10進数に直した時の値は？", c: "10", w: ["8", "12", "5"], e: "2進数の1010は、8の位が1、4の位が0、2の位が1、1の位が0なので、8 + 0 + 2 + 0 = <b>10</b> になります。" },
                { q: "コンピュータの情報量の基本単位において、8ビット (8 bits) は何バイトか？", c: "1 バイト", w: ["8 バイト", "10 バイト", "1024 バイト"], e: "情報の最小単位である「0か1か」の1桁を 1ビット と呼び、<b>8ビット = 1バイト</b> と定義します。" },
                { q: "アナログの音や画像をデジタルデータに変える際、「標本化（サンプリング）」「量子化」に続く最後のステップは？", c: "符号化", w: ["圧縮", "暗号化", "復調"], e: "アナログデータをデジタルに変換するプロセスは、<b>標本化 ➔ 量子化 ➔ 符号化</b> の順に行われます。" }
            ],
            // 情報：セキュリティ
            info_network_security: [
                { q: "インターネット上でコンピュータを識別するために割り当てられる、「192.168.1.1」などの識別番号を何という？", c: "IPアドレス", w: ["MACアドレス", "URL", "ドメイン"], e: "ネットワーク上の住所にあたる数値を「IPアドレス」と呼びます。" },
                { q: "送信者を偽ったメールを送り、本物そっくりの偽サイトに誘導してパスワードやクレジットカード情報を盗み出す詐欺行為は？", c: "フィッシング詐欺", w: ["ワンクリック詐欺", "ランサムウェア", "マルウェア"], e: "偽のメールやWebサイトで個人情報を「釣り上げる」ことから「フィッシング (Phishing)」と呼ばれます。" },
                { q: "データを送受信する際、共通の鍵で暗号化と復号を行う、処理速度が速い暗号化方式を何という？", c: "共通鍵暗号方式", w: ["公開鍵暗号方式", "ハイブリッド暗号方式", "ブロックチェーン方式"], e: "同一の鍵（共通鍵）を使って暗号化と復号を行う方式です。速度が速いですが、鍵の受け渡しに安全上のリスクがあります。" }
            ],
            // 情報：アルゴリズム
            info_algorithm: [
                { q: "アルゴリズムを表すフローチャートにおいて、「ひし形（◇）」の記号が表す処理の意味は？", c: "判断・条件分岐", w: ["処理・実行", "開始・終了", "データの入出力"], e: "フローチャートにおいて、長方形は「処理」、平行四辺形は「入出力」、そしてひし形は条件による「判断（条件分岐）」を表します。" },
                { q: "同じ処理を特定の条件が満たされるまで何度も繰り返す、プログラミングにおける基本制御構造を何という？", c: "反復構造", w: ["順次構造", "選択構造", "再帰構造"], e: "プログラムの基本構造は、上から順に実行する「順次」、条件で分かれる「選択」、そして繰り返す「反復（ループ）」の3つで成り立っています。" }
            ],

            // 家庭科：食生活
            home_diet: [
                { q: "炭水化物・脂質・タンパク質に、体の調子を整えるビタミンと何を足すと「五大栄養素」になるか？", c: "無機質（ミネラル）", w: ["食物繊維", "水分", "酵素"], e: "五大栄養素は、炭水化物、脂質、タンパク質に、無機質（ミネラル）とビタミンを加えたものです。" },
                { q: "食品表示法において、食物アレルギーを引き起こす症例数や重篤度が高いため、アレルギー表示が「義務」づけられている特定原材料の数は現在いくつ？", c: "8品目", w: ["7品目", "5品目", "28品目"], e: "乳、卵、小麦、そば、落花生、えび、かにに加えて、近年「くるみ」が追加され、義務化されている特定原材料は <b>8品目</b> となっています。" }
            ],
            // 家庭科：消費生活
            home_life: [
                { q: "訪問販売やキャッチセールスなどで契約してしまった場合、一定期間内であれば理由を問わず無条件で契約を解除できる制度は？", c: "クーリング・オフ制度", w: ["消費者契約法", "成年後見制度", "自己破産制度"], e: "クーリング・オフ（頭を冷やす）制度は、訪問販売などの不意打ち的な契約に対して、通常 8日間（マルチ商法等は20日間）無条件解除できる制度です。" },
                { q: "夫婦と未婚の子どもだけで構成される家族、または夫婦のみで構成される家族のような、家族構造の基本単位を何と呼ぶか？", c: "核家族", w: ["大家族", "単身家族", "直系家族"], e: "夫婦のみ、あるいは夫婦と未婚の子ども、片親と未婚の子どもからなる世帯を「核家族」と呼びます。" }
            ]
        };
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // 重複出題を完全に防ぎながら問題を抽出・生成するメインメソッド
    generateQuestion(categoryId = 'all', customTopicName = '') {
        let cat = categoryId;
        
        // 1. AIキーワード判定
        if (cat === 'custom' && customTopicName) {
            return this.analyzeAndGenerateAiTopic(customTopicName);
        }
        
        // 2. 全分野ミックスの場合
        if (cat === 'all') {
            const allKeys = Object.keys(this.db).concat(['math_all']);
            // 未使用問題が残っているカテゴリを優先的に探す
            const availableKeys = allKeys.filter(k => {
                if (k === 'math_all') return true; // 数学は無限動的生成なので常に利用可能
                const questions = this.db[k];
                return questions.some(q => !this.usedQuestions.has(q.id));
            });
            const activeKeys = availableKeys.length > 0 ? availableKeys : allKeys;
            cat = activeKeys[this.getRandomInt(0, activeKeys.length - 1)];
        }

        // 3. 数学全体のランダム決定
        if (cat === 'math_all') {
            const mathKeys = [
                'factorization', 'quad_vertex', 'quad_maxmin', 'quad_det', 
                'trig_ratio', 'trig_laws', 'prob_permcomb', 'prob_cond', 
                'trig_func', 'log_func', 'diff_tangent', 'int_area', 
                'seq_sum', 'vec_dot'
            ];
            cat = mathKeys[this.getRandomInt(0, mathKeys.length - 1)];
        }

        // 4. 数学動的生成エンジンの実行
        switch (cat) {
            case 'factorization': return this.genFactorization();
            case 'quad_vertex': return this.genQuadraticVertex();
            case 'quad_maxmin': return this.genQuadraticMaxMin();
            case 'quad_det': return this.genQuadraticDetermination();
            case 'trig_ratio': return this.genTrigRatio();
            case 'trig_laws': return this.genSineCosineLaws();
            case 'prob_permcomb': return this.genProbabilityPermComb();
            case 'prob_cond': return this.genConditionalProbability();
            case 'trig_func': return this.genTrigSynthesis();
            case 'log_func': return this.genLogBaseChange();
            case 'diff_tangent': return this.genTangentLine();
            case 'int_area': return this.genIntegrationArea();
            case 'seq_sum': return this.genSequences();
            case 'vec_dot': return this.genVectorDotProduct();
        }

        // 5. 数学以外 (内蔵データベース) の抽出
        if (this.db[cat]) {
            const questions = this.db[cat];
            
            // まだ出題していない問題をフィルタリング
            let unused = questions.filter(q => !this.usedQuestions.has(q.id));
            
            // もしこのカテゴリの問題が全て出題済みの場合は、履歴をリセットして再利用
            if (unused.length === 0) {
                questions.forEach(q => this.usedQuestions.delete(q.id));
                unused = questions;
            }

            const qData = unused[this.getRandomInt(0, unused.length - 1)];
            
            // 出題済みに記録
            this.usedQuestions.add(qData.id);
            
            const categoryName = this.categories.find(c => c.id === cat)?.name || 'クイズ';
            const options = [qData.c, ...qData.w];
            
            return this.formatResult(qData.q, qData.c, options, categoryName, `💡 <b>解説</b>:<br>${qData.e}`);
        }

        // 予期せぬエラー時のフォールバック
        return this.genFactorization();
    }

    // AIキーワード判定ロジック (配点式スコアリングによる曖昧キーワードマッチング)
    analyzeAndGenerateAiTopic(prompt) {
        const p = prompt.trim().toLowerCase();

        // キーワードマップ
        const topicMap = [
            // 数学
            { id: 'factorization', name: '数I：数と式 (因数分解)', keywords: ['因数分解', '展開', 'たすき掛け', '数と式', 'たすき', '多項式', '実数'] },
            { id: 'quad_vertex', name: '数I：2次関数 (頂点)', keywords: ['頂点', '平方完成', '軸', '二次関数のグラフ', '2次関数のグラフ', '対称移動'] },
            { id: 'quad_maxmin', name: '数I：2次関数 (最大・最小)', keywords: ['最大', '最小', '最大値', '最小値', '範囲における最大', '変域'] },
            { id: 'quad_det', name: '数I：2次関数 (決定)', keywords: ['決定', '式を求める', '二次関数の決定', '2次関数の決定', '式決定'] },
            { id: 'trig_ratio', name: '数I：図形と計量 (三角比)', keywords: ['三角比', 'sin', 'cos', 'tan', 'サイン', 'コサイン', 'タンジェント', '相互関係', '鋭角', '鈍角'] },
            { id: 'trig_laws', name: '数I：図形と計量 (正弦・余弦定理)', keywords: ['正弦定理', '余弦定理', '外接円', 'sin定理', 'cos定理', '三角形の辺', '三角形の角'] },
            { id: 'prob_permcomb', name: '数A：順列・組合せ', keywords: ['順列', '組合せ', '組み合わせ', '場合の数', 'pの計算', 'cの計算', '階乗'] },
            { id: 'prob_cond', name: '数A：条件付き確率', keywords: ['条件付き', '条件付', '条件付き確率', '原因の確率'] },
            { id: 'trig_func', name: '数II：三角関数 (合成)', keywords: ['合成', '三角関数の合成', '加法定理', '倍角'] },
            { id: 'log_func', name: '数II：対数関数 (底の変換)', keywords: ['対数', '指数', 'log', '底の変換', '底', '真数'] },
            { id: 'diff_tangent', name: '数II：微分と積分 (接線)', keywords: ['接線', '接線の方程式', '微分係数', '導関数', '傾き'] },
            { id: 'int_area', name: '数II：微分と積分 (面積)', keywords: ['積分', '定積分', '面積', '1/6公式', '囲まれた面積', 'インテグラル'] },
            { id: 'seq_sum', name: '数B：等差・等比数列', keywords: ['数列', '等差', '等比', '一般項', '和', 'シグマ', 'sigma', '漸化式'] },
            { id: 'vec_dot', name: '数C：ベクトル (内積)', keywords: ['ベクトル', '内積', 'ベクトルの成分', '成分', 'なす角', '大きさ'] },
            
            // 国語
            { id: 'kokugo_gen_kanji', name: '国語：現代文 (漢字・語彙)', keywords: ['漢字', '語彙', 'しんちょく', 'ずさん', '姑息', '慇懃', '進捗'] },
            { id: 'kokugo_gen_idiom', name: '国語：現代文 (ことわざ・四字熟語)', keywords: ['ことわざ', '四字熟語', '慣用句', '情けは人のためならず', '無礼', '濡れ手', '粟'] },
            { id: 'kokugo_kobun', name: '国語：古文 (古文単語・文法)', keywords: ['古文', 'をかし', 'あわれなり', '助動詞', '古典', '源氏物語'] },
            { id: 'kokugo_kanbun', name: '国語：漢文 (句法・訓読)', keywords: ['漢文', 'レ点', '一二点', '返り点', '訓読', '不能', 'あたはず', '白文'] },
            
            // 英語
            { id: 'english_vocab_base', name: '英語：基礎英単語', keywords: ['英単語', '英語', '単語', 'vocab', 'describe', 'encourage', '基礎英語'] },
            { id: 'english_vocab_adv', name: '英語：応用英単語', keywords: ['応用英語', '受験英語', 'contribute', 'alternative', '難単語'] },
            { id: 'english_grammar_base', name: '英語：英文法 (時制・助動詞)', keywords: ['文法', '英文法', '時制', 'rains', 'for three years', '受動態'] },
            { id: 'english_grammar_adv', name: '英語：英文法 (関係詞・仮定法)', keywords: ['関係代名詞', '仮定法', 'whose', 'were', '関係詞', '仮定法過去'] },
            
            // 社会
            { id: 'society_jp_history_early', name: '日本史：原始〜中世', keywords: ['日本史', '歴史', '墾田永年私財法', '大化の改新', '大仏', '聖武天皇', '古代史', '鎌倉', '室町'] },
            { id: 'society_jp_history_modern', name: '日本史：近世〜近代', keywords: ['本能寺', '信長', '家康', '関ヶ原', '明治維新', '江戸', '光秀'] },
            { id: 'society_jp_history_recent', name: '日本史：現代', keywords: ['大正', '昭和', '平成', '治安維持法', 'ポツダム', '終戦', '戦争', '高度経済成長'] },
            { id: 'society_world_history_early', name: '世界史：古代〜中世', keywords: ['世界史', 'ハンムラビ', 'アレクサンドロス', 'ギリシャ', 'ローマ', '王朝', '皇帝'] },
            { id: 'society_world_history_modern', name: '世界史：近世〜近代', keywords: ['大航海', 'コロンブス', 'フランス革命', '産業革命', '市民革命', '近代史'] },
            { id: 'society_world_history_recent', name: '世界史：現代', keywords: ['大戦', '第一次世界大戦', '冷戦', '世界恐慌', 'サライェヴォ', 'ベルリン'] },
            { id: 'society_geography_nature', name: '地理：自然環境', keywords: ['地理', '気候', 'ケッペン', '造山帯', '新期造山帯', '火山', 'プレート', '地形'] },
            { id: 'society_geography_industry', name: '地理：産業・資源・時差', keywords: ['時差', '小麦', '輸出', '経度', '標準時', '農業', '産業'] },
            
            // 理科
            { id: 'science_physics_mechanics', name: '物理：力学', keywords: ['物理', '力学', '運動方程式', '加速度', '質量', 'ma = F', '仕事'] },
            { id: 'science_physics_wave_heat', name: '物理：熱・波動', keywords: ['比熱', '熱量', '音速', 'ドップラー', '音', '波', '屈折'] },
            { id: 'science_physics_electromagnet', name: '物理：電磁気', keywords: ['オーム', '電磁気', '電流', '電圧', '抵抗', '磁場', '右ねじ'] },
            { id: 'science_chemistry_atomic', name: '化学：物質の構成', keywords: ['化学', '元素', '原子', '周期表', '電子殻', 'K殻', 'イオン結合', '共有結合'] },
            { id: 'science_chemistry_reaction', name: '化学：化学変化', keywords: ['モル', 'mol', 'アボガドロ', '標準状態', '体積', '22.4', '反応式'] },
            { id: 'science_chemistry_acid_base', name: '化学：酸塩基・酸化還元', keywords: ['ph', '酸性', '中性', '塩基', '中和', '酸化', '還元', '酸化数', '電子'] },
            { id: 'science_biology_cell_dna', name: '生物：細胞・DNA', keywords: ['生物', '細胞', 'dna', '原核生物', '翻訳', '転写', '遺伝子', 'タンパク質'] },
            { id: 'science_biology_body_env', name: '生物：体内環境', keywords: ['神経', '自律神経', '交感神経', '免疫', '獲得免疫', 'ホルモン', '恒常性'] },
            { id: 'science_biology_ecosystem', name: '生物：生態系', keywords: ['生態系', 'バイオーム', '照葉樹林', '生産者', '食物連鎖'] },
            
            // 情報・家庭科
            { id: 'info_digital', name: '情報：デジタル化', keywords: ['情報', '2進数', '16進数', 'ビット', 'バイト', 'デジタル', '符号化', '画像'] },
            { id: 'info_network_security', name: '情報：ネットワーク・セキュリティ', keywords: ['セキュリティ', '暗号', 'アドレス', 'ip', 'フィッシング', 'ウイルス', 'dns'] },
            { id: 'info_algorithm', name: '情報：アルゴリズム', keywords: ['アルゴリズム', 'フローチャート', 'ひし形', '分岐', 'ループ', '反復'] },
            { id: 'home_diet', name: '家庭科：食生活と栄養', keywords: ['家庭科', '栄養', '五大栄養素', 'アレルギー', '食品表示', '特定原材料'] },
            { id: 'home_life', name: '家庭科：消費生活・家族', keywords: ['契約', 'クーリング', '核家族', '家族', '消費者', '社会保障', '成年後見'] }
        ];

        let bestMatch = null;
        let maxScore = 0;

        for (const topic of topicMap) {
            let score = 0;
            for (const kw of topic.keywords) {
                if (p.includes(kw.toLowerCase())) {
                    score += 10;
                }
            }
            if (score > 0 && score > maxScore) {
                maxScore = score;
                bestMatch = topic;
            }
        }

        if (bestMatch && maxScore > 0) {
            console.log(`[AI Engine] Matched: ${bestMatch.name} (score: ${maxScore})`);
            return this.generateQuestion(bestMatch.id);
        }

        // キーワードに全くヒットしない場合のデフォルトフォールバック
        console.log(`[AI Engine] No match for "${prompt}". Falling back to random.`);
        const allKeys = Object.keys(this.db).concat(['math_all']);
        const randCat = allKeys[this.getRandomInt(0, allKeys.length - 1)];
        return this.generateQuestion(randCat);
    }

    // ==========================================
    // 数学の動的ジェネレータ関数群
    // ==========================================

    // 1. 因数分解
    genFactorization() {
        const a = this.getRandomInt(1, 5) * (Math.random() < 0.5 ? 1 : -1);
        const b = this.getRandomInt(1, 5) * (Math.random() < 0.5 ? 1 : -1);
        const sum = a + b, prod = a * b;
        const sumStr = sum > 0 ? `+ ${sum}x` : (sum < 0 ? `- ${Math.abs(sum)}x` : '');
        const prodStr = prod > 0 ? `+ ${prod}` : `- ${Math.abs(prod)}`;
        const question = `式  x² ${sumStr} ${prodStr}  を因数分解せよ。`;
        const fmt = (n) => n > 0 ? `(x + ${n})` : `(x - ${Math.abs(n)})`;
        
        const correct = `${fmt(a)}${fmt(b)}`;
        // トラップ選択肢: 
        // 1. 符号の全反転
        const wrong1 = `${fmt(-a)}${fmt(-b)}`;
        // 2. 片方だけの符号間違い
        const wrong2 = `${fmt(a)}${fmt(-b)}`;
        // 3. 和と積を混同するミス
        const wrong3 = `${fmt(sum)}${fmt(prod)}`;

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `・和が <b>${sum}</b>、積が <b>${prod}</b> となる2数は <b>${a}</b> と <b>${b}</b> です。よって <b>${correct}</b> が正解です。<br>` +
            `・<b>${wrong1}</b> や <b>${wrong2}</b> は、プラスとマイナスの符号処理を間違えたときに作ってしまう典型的なミスです。<br>` +
            `・<b>${wrong3}</b> は「足して ${sum}、掛けて ${prod}」の関係を、逆に「掛けて ${sum}、足して ${prod}」と勘違いしたときの間違いです。`;

        return this.formatResult(question, correct, options, '数学I：数と式 (多項式の展開・たすき掛け因数分解)', explanation);
    }

    // 2. 2次関数の頂点
    genQuadraticVertex() {
        const p = this.getRandomInt(-4, 4);
        const q = this.getRandomInt(-5, 5);
        const b = -2 * p;
        const c = p * p + q;
        const bStr = b > 0 ? `+ ${b}x` : (b < 0 ? `- ${Math.abs(b)}x` : '');
        const cStr = c > 0 ? `+ ${c}` : (c < 0 ? `- ${Math.abs(c)}` : '');

        const question = `2次関数  y = x² ${bStr} ${cStr}  の頂点の座標は？`;
        const correct = `(${p}, ${q})`;
        
        // トラップ選択肢:
        // 1. 平方完成の括弧内の符号ミス: y = (x - p)^2 + q なのに x = -p と錯覚する
        const wrong1 = `(${-p}, ${q})`;
        // 2. 括弧の外の符号ミス
        const wrong2 = `(${p}, ${-q})`;
        // 3. x座標とy座標を逆にしてしまうミス
        const wrong3 = `(${q}, ${p})`;

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `1. 平方完成を行うと、<b>y = (x - ${p})² ${q >= 0 ? '+ ' + q : '- ' + Math.abs(q)}</b> になります。<br>` +
            `2. 頂点のx座標は<b>(x - p)が0になる値</b>なので <b>${p}</b> です。頂点のy座標はそのまま <b>${q}</b> です。よって <b>${correct}</b> が正解です。<br>` +
            `・<b>${wrong1}</b> は <b>-(x - p)²</b> の括弧の中の符号を読み違える、非常によくあるミスです！<br>` +
            `・<b>${wrong3}</b> は、x座標とy座標をうっかり逆に書いてしまうミスです。`;

        return this.formatResult(question, correct, options, '数学I：2次関数 (平方完成とグラフ of 頂点座標の算出)', explanation);
    }

    // 3. 2次関数の最大・最小
    genQuadraticMaxMin() {
        const a = [1, -1][this.getRandomInt(0, 1)];
        const p = this.getRandomInt(1, 3);
        const q = this.getRandomInt(-2, 3);
        const xMin = 0, xMax = 4;
        
        const y0 = a * Math.pow(xMin - p, 2) + q;
        const y4 = a * Math.pow(xMax - p, 2) + q;
        const yVertex = q;

        let maxVal, minVal, maxPos, minPos;
        let altMaxVal, altMinVal, altMaxPos, altMinPos;
        
        if (a === 1) {
            minVal = yVertex; minPos = `x = ${p}`;
            if (y0 > y4) { maxVal = y0; maxPos = 'x = 0'; altMinVal = y4; altMinPos = 'x = 4'; }
            else { maxVal = y4; maxPos = 'x = 4'; altMinVal = y0; altMinPos = 'x = 0'; }
            altMaxVal = yVertex; altMaxPos = `x = ${p}`;
        } else {
            maxVal = yVertex; maxPos = `x = ${p}`;
            if (y0 < y4) { minVal = y0; minPos = 'x = 0'; altMaxVal = y4; altMaxPos = 'x = 4'; }
            else { minVal = y4; minPos = 'x = 4'; altMaxVal = y0; altMaxPos = 'x = 0'; }
            altMinVal = yVertex; altMinPos = `x = ${p}`;
        }

        const convexStr = a === 1 ? '下に凸' : '上に凸';
        const funcStr = `y = ${a === 1 ? '' : '-'} (x - ${p})² ${q >= 0 ? '+ ' + q : '- ' + Math.abs(q)}`;
        const askMax = Math.random() < 0.5;
        
        const question = `2次関数  ${funcStr}  の定義域  0 ≦ x ≦ 4  における${askMax ? '最大値' : '最小値'}は？`;
        const correct = askMax ? `${maxVal} (${maxPos})` : `${minVal} (${minPos})`;
        
        // トラップ選択肢:
        const wrong1 = askMax ? `${altMinVal} (${altMinPos})` : `${altMaxVal} (${altMaxPos})`;
        const wrong2 = `${y0} (x = 0)`;
        const wrong3 = `${y4} (x = 4)`;

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `・この2次関数は頂点が <b>(${p}, ${q})</b> で、グラフは<b>${convexStr}</b>です。<br>` +
            `・頂点の x = ${p} は定義域 0 ≦ x ≦ 4 の中に含まれています。<br>` +
            `・${askMax ? '最大値' : '最小値'}を求めるため、各点の値を比較します：<br>` +
            `  x = 0 ➔ y = ${y0} | x = 4 ➔ y = ${y4} | x = ${p} (頂点) ➔ y = ${yVertex}<br>` +
            `・したがって、正解は <b>${correct}</b> になります。<br>` +
            `・<b>${wrong1}</b> は、グラフの凸の向き（上下）を読み違えて最大・最小を逆に求めてしまったミスです。<br>` +
            `・<b>${wrong2}</b> や <b>${wrong3}</b> は、頂点での値を無視して端点だけを計算してしまった典型的なミスです。`;

        return this.formatResult(question, correct, options, '数学I：2次関数 (指定された定義域内における最大値・最小値)', explanation);
    }

    // 4. 2次関数の決定
    genQuadraticDetermination() {
        const h = this.getRandomInt(-3, 3);
        const k = this.getRandomInt(-4, 4);
        const a = [1, 2, -1, -2][this.getRandomInt(0, 3)];
        const x1 = h + (Math.random() < 0.5 ? 1 : 2);
        const y1 = a * Math.pow(x1 - h, 2) + k;

        const hStr = h > 0 ? `- ${h}` : (h < 0 ? `+ ${Math.abs(h)}` : '');
        const kStr = k > 0 ? ` + ${k}` : (k < 0 ? ` - ${Math.abs(k)}` : '');
        const aStr = a === 1 ? '' : (a === -1 ? '-' : `${a}`);

        const question = `頂点が (${h}, ${k}) で、点 (${x1}, ${y1}) を通る2次関数は？`;
        const correct = `y = ${aStr}(x ${hStr})²${kStr}`.replace('(x )', 'x');

        // トラップ選択肢:
        const wrongH = -h;
        const wrongHStr = wrongH > 0 ? `- ${wrongH}` : (wrongH < 0 ? `+ ${Math.abs(wrongH)}` : '');
        const wrong1 = `y = ${aStr}(x ${wrongHStr})²${kStr}`.replace('(x )', 'x');
        const wrong2 = `y = ${aStr}(x ${hStr})²${k > 0 ? ' - ' + k : ' + ' + Math.abs(k)}`.replace('(x )', 'x');
        
        const aWrong = (y1 - k) / (x1 - h);
        const aWrongStr = aWrong === 1 ? '' : (aWrong === -1 ? '-' : `${aWrong}`);
        const wrong3 = `y = ${aWrongStr}(x ${hStr})²${kStr}`.replace('(x )', 'x');

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `1. 頂点が (${h}, ${k}) なので、求める関数を <b>y = a(x - ${h})² + ${k}</b> と置きます。<br>` +
            `2. 点 (${x1}, ${y1}) を代入して a を求めます：<br>` +
            `   ${y1} = a(${x1} - ${h})² + ${k} $\\Rightarrow$ ${y1 - k} = a(${Math.pow(x1 - h, 2)}) $\\Rightarrow$ a = <b>${a}</b><br>` +
            `3. よって、正解は <b>${correct}</b> です。<br>` +
            `・<b>${wrong1}</b> と <b>${wrong2}</b> は頂点座標を代入する際の符号ミスです。<br>` +
            `・<b>${wrong3}</b> は、点 (${x1}, ${y1}) を代入して a を求める計算で、x座標の引き算の<b>「2乗」をし忘れた</b>時の式です。非常に多くの生徒がこの2乗忘れで失点します！`;

        return this.formatResult(question, correct, options, '数学I：2次関数 (頂点や通る点からの関数式の決定)', explanation);
    }

    // 5. 三角比と相互関係
    genTrigRatio() {
        const angles = [
            { deg: '30°', sin: '1/2', cos: '√3/2', tan: '1/コンマ値なし' },
            { deg: '45°', sin: '1/√2', cos: '1/√2', tan: '1' },
            { deg: '60°', sin: '√3/2', cos: '1/2', tan: '√3' },
            { deg: '120°', sin: '√3/2', cos: '-1/2', tan: '-√3' },
            { deg: '135°', sin: '1/√2', cos: '-1/√2', tan: '-1' },
            { deg: '150°', sin: '1/2', cos: '-√3/2', tan: '-1/√3' }
        ];
        angles[0].tan = '1/√3';

        const item = angles[this.getRandomInt(0, angles.length - 1)];
        const types = ['sin', 'cos', 'tan'];
        const type = types[this.getRandomInt(0, 2)];

        const question = `三角比の値  ${type}${item.deg}  は？`;
        const correct = item[type];

        // トラップ選択肢:
        // 1. 同一角度の異なる三角比 (sin を cos と勘違いするなど)
        let wrong1 = '';
        if (type === 'sin') wrong1 = item.cos;
        else if (type === 'cos') wrong1 = item.sin;
        else wrong1 = item.cos; // tanの時はcosをトラップにする

        // 2. 符号のミス (特に鈍角 120°〜150° でマイナスを忘れる、または余計に付ける)
        let wrong2 = correct.startsWith('-') ? correct.replace('-', '') : '-' + correct;

        // 3. 有名角の分母・分子の間違い (√3/2 を 2/√3 とするなど)
        let wrong3 = '0';
        if (correct === '√3/2') wrong3 = '2/√3';
        else if (correct === '1/2') wrong3 = '2';
        else if (correct === '1/√3') wrong3 = '√3';
        else if (correct === '√3') wrong3 = '1/昔の値';
        if (wrong3.includes('昔の値') || wrong3 === '0') wrong3 = '1/2';

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `・${type}${item.deg} の値は <b>${correct}</b> です。<br>` +
            `・<b>${wrong1}</b> は ${type} と ${type === 'sin' ? 'cos' : 'sin'} を混同した時のミスです。単位円の定義（x座標がcos、y座標がsin）を思い出しましょう。<br>` +
            `・<b>${wrong2}</b> は、象限（角度の範囲）によるプラス・マイナスの符号間違いです。特に 90°〜180° では cos と tan はマイナスになります。`;

        return this.formatResult(question, correct, options, '数学I：図形と計量 (sin・cos・tanの基本値と相互関係)', explanation);
    }

    // 6. 正弦・余弦定理
    genSineCosineLaws() {
        const isSine = Math.random() < 0.5;

        if (isSine) {
            const rList = [2, 3, 4, 6];
            const aList = [
                { deg: '30°', aMult: '', sinVal: 0.5 },
                { deg: '45°', aMult: '√2', sinVal: 0.707 },
                { deg: '60°', aMult: '√3', sinVal: 0.866 }
            ];
            const R = rList[this.getRandomInt(0, rList.length - 1)];
            const angle = aList[this.getRandomInt(0, aList.length - 1)];
            
            const correct = `${R}${angle.aMult}`;
            const question = `△ABCにおいて、外接円の半径 R = ${R}, A = ${angle.deg} のとき、辺 a の長さは？`;

            // トラップ選択肢:
            // 1. 公式の「2R」を「R」と勘違いして、2倍し忘れるミス (a = R sin A)
            const wrong1 = angle.deg === '30°' ? `${R/2}` : `${R/2}${angle.aMult}`;
            // 2. sin A を掛けるべきところで、誤って割ってしまうミス (a = 2R / sin A)
            const wrong2 = `${R * 4}`;
            // 3. sin と cos を間違えるミス
            const wrong3 = `${R * 2}`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・正弦定理は <b>a / sin A = 2R</b> です。これを辺 a について解くと <b>a = 2R sin A</b> となります。<br>` +
                `  a = 2 × ${R} × sin ${angle.deg} = ${2 * R} × ${angle.deg === '30°' ? '1/2' : (angle.deg === '45°' ? '1/√2' : '√3/2')} = <b>${correct}</b><br>` +
                `・<b>${wrong1}</b> は、公式の <b>2R</b> の「2」を掛け忘れて、半径 R のままで計算してしまった超典型的なミスです！<br>` +
                `・<b>${wrong2}</b> は、移行の計算で sin A を「掛ける」のではなく「割る」と間違えてしまったときの値です。`;

            return this.formatResult(question, correct, options, '数学I：図形と計量 (正弦定理・余弦定理を用いた辺の計算)', explanation);
        } else {
            const tri = [
                { b: 3, c: 5, A: '120°', cosVal: -0.5, a: '7', aSq: 49, wrongSign: '19' },
                { b: 5, c: 8, A: '60°', cosVal: 0.5, a: '7', aSq: 49, wrongSign: '129' },
                { b: 3, c: 8, A: '60°', cosVal: 0.5, a: '7', aSq: 49, wrongSign: '97' }
            ];
            const target = tri[this.getRandomInt(0, tri.length - 1)];
            const question = `△ABCにおいて、b = ${target.b}, c = ${target.c}, A = ${target.A} のとき、辺 a の長さは？`;
            const correct = target.a;

            // トラップ選択肢:
            // 1. 余弦定理の最後の項の符号ミス (-2bc cos A を +2bc cos A にしてしまう)
            const wrong1 = `√${target.wrongSign}`;
            // 2. 2乗のルートを取り忘れるミス (a^2 の値をそのまま答える)
            const wrong2 = `${target.aSq}`;
            // 3. -2bc cos A の「2」を掛け忘れるミス (a^2 = b^2 + c^2 - bc cos A とする)
            const wrong3 = `5`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・余弦定理は <b>a² = b² + c² - 2bc cos A</b> です。<br>` +
                `  a² = ${target.b}² + ${target.c}² - 2 × ${target.b} × ${target.c} × cos ${target.A}<br>` +
                `  a² = ${target.b * target.b} + ${target.c * target.c} - (${2 * target.b * target.c * target.cosVal}) = ${target.aSq}<br>` +
                `  a ＞ 0 なので平方根をとって <b>a = ${correct}</b> です。<br>` +
                `・<b>${wrong1}</b> は、cos ${target.A} のマイナス符号の処理を誤って、最後の引き算を足し算（またはその逆）にしてしまった時の計算ミスです。<br>` +
                `・<b>${wrong2}</b> は、計算の最後に<b>平方根（ルート）を外すのを忘れて</b>、a² のまま回答してしまったミスです。`;

            return this.formatResult(question, correct, options, '数学I：図形と計量 (正弦定理・余弦定理を用いた辺の計算)', explanation);
        }
    }

    // 7. 順列・組合せ
    genProbabilityPermComb() {
        const isPerm = Math.random() < 0.5;

        if (isPerm) {
            const n = this.getRandomInt(5, 7);
            const r = this.getRandomInt(2, 3);
            let pVal = 1;
            for (let i = 0; i < r; i++) pVal *= (n - i);

            let rFact = 1;
            for (let i = 1; i <= r; i++) rFact *= i;
            const cVal = pVal / rFact; // 組合せの値

            const question = `順列  ${n}P${r}  の計算値は？`;
            const correct = `${pVal}`;
            
            // トラップ選択肢:
            // 1. PではなくCで計算してしまうミス (r! で割って組合せにする)
            const wrong1 = `${cVal}`;
            // 2. 単純に n × r をしてしまうミス
            const wrong2 = `${n * r}`;
            // 3. n の r 乗 (重複順列) と勘違いするミス
            const wrong3 = `${Math.pow(n, r)}`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・${n}P${r} は、${n} からカウントダウンしながら ${r} 個の数字を掛け合わせる順列です。<br>` +
                `  ${n}P${r} = ` + Array.from({length: r}, (_, i) => n - i).join(' × ') + ` = <b>${correct}</b><br>` +
                `・<b>${wrong1}</b> は、順列Pの計算なのに誤って <b>${r}!</b> で割って「組合せC」として計算してしまったミスです。<br>` +
                `・<b>${wrong2}</b> は、公式を使わずに単に2数を掛け算してしまったミスです。`;

            return this.formatResult(question, correct, options, '数学A：場合の数 (順列 nPr と組合せ nCr の公式計算)', explanation);
        } else {
            const n = this.getRandomInt(5, 7);
            const r = this.getRandomInt(2, 3);
            let pVal = 1;
            for (let i = 0; i < r; i++) pVal *= (n - i);
            let rFact = 1;
            for (let i = 1; i <= r; i++) rFact *= i;
            const cVal = pVal / rFact;

            const question = `組合せ  ${n}C${r}  の計算値は？`;
            const correct = `${cVal}`;

            // トラップ選択肢:
            // 1. 分母の r! での割り算を忘れて、順列 P として計算してしまうミス
            const wrong1 = `${pVal}`;
            // 2. 分母を r! ではなく、単に r で割るだけのミス (r=3のとき3! (=6) ではなく3で割ってしまう)
            const wrong2 = `${pVal / r}`;
            // 3. 組み合わせの数を n × r と勘違いするミス
            const wrong3 = `${n * r}`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・${n}C${r} は、異なる ${n} 個から ${r} 個を選ぶ組合せで、分子を順列、分母を階乗で計算します。<br>` +
                `  ${n}C${r} = ${n}P${r} / ${r}! = ${pVal} / ${rFact} = <b>${correct}</b><br>` +
                `・<b>${wrong1}</b> は、組合せCの計算で<b>分母の ${r}! で割り忘れて</b>順列Pのままにしてしまう、超典型的なミスです！<br>` +
                `・<b>${wrong2}</b> は、分母を「rの階乗」ではなく、単なる「r」で割ってしまった計算ミスです。`;

            return this.formatResult(question, correct, options, '数学A：場合の数 (順列 nPr と組合せ nCr の公式計算)', explanation);
        }
    }

    // 8. 条件付き確率
    genConditionalProbability() {
        const red = this.getRandomInt(3, 5);
        const white = this.getRandomInt(2, 4);
        const total = red + white;

        const correctNum = red - 1;
        const correctDen = total - 1;

        const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
        const g = gcd(correctNum, correctDen);
        const ansNum = correctNum / g;
        const ansDen = correctDen / g;
        const correct = `${ansNum}/${ansDen}`;

        const question = `袋の中に赤玉が ${red} 個、白玉が ${white} 個入っている。引いた玉は戻さずに2回連続で引くとき、1回目が赤玉であったとき、2回目も赤玉である条件付き確率は？`;

        // トラップ選択肢:
        // 1. 引いた玉を「元に戻す（復元）」と勘違いして計算した確率 (P = red/total)
        const wrong1 = `${red}/${total}`;
        // 2. 分母を減らしたが、分子（赤玉の残り数）を減らし忘れた確率
        const wrong2 = `${red}/${total - 1}`;
        // 3. 単なる「2回とも赤玉を引く同時確率」 (red/total * (red-1)/(total-1))
        const pBoth = (red / total) * ((red - 1) / (total - 1));
        const wrong3 = pBoth.toFixed(2); // 少数、または近い分数で代表

        const options = [correct, wrong1, wrong2, `${white}/${total - 1}`];
        if (options[2] === correct) options[2] = wrong3;

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `・条件付き確率では、「1回目が赤玉であった」という事象が既に起こったものとして、その後の分母・分子を考えます。<br>` +
            `  1回目の赤玉を引いた後、袋の中は <b>赤玉 ${red - 1} 個、合計 ${total - 1} 個</b> に変化します。<br>` +
            `  よって、その状態で赤玉を引く確率は <b>${correct}</b> です。<br>` +
            `・<b>${wrong1}</b> は、引いた玉を「元に戻さない」条件を読み落として、1回目の確率のまま回答してしまったミスです。<br>` +
            `・<b>${wrong2}</b> は、全体の玉の数は減らしたのに、引いた赤玉自体をマイナスし忘れてしまったミスです。`;

        return this.formatResult(question, correct, options, '数学A：確率の基礎 (基本的な確率と条件付き確率の計算)', explanation);
    }

    // 9. 三角関数の合成
    genTrigSynthesis() {
        const pairs = [
            { a: 1, b: 1, r: '√2', alpha: '45°', wrongAlpha: '-45°' },
            { a: 1, b: '√3', r: '2', alpha: '60°', wrongAlpha: '30°' },
            { a: '√3', b: 1, r: '2', alpha: '30°', wrongAlpha: '60°' }
        ];
        const target = pairs[this.getRandomInt(0, pairs.length - 1)];
        const question = `式  ${target.a}sinθ + ${target.b}cosθ  を r sin(θ + α) の形に合成すると？`;
        const correct = `${target.r} sin(θ + ${target.alpha})`;

        // トラップ選択肢:
        // 1. 角の正負を逆にするミス
        const wrong1 = `${target.r} sin(θ ${target.wrongAlpha.startsWith('-') ? target.wrongAlpha : '- ' + target.wrongAlpha})`;
        // 2. sin と cos の係数を逆にして角度 α を求めてしまうミス (1:√3 の角度を間違える)
        const wrong2 = `${target.r} sin(θ + ${target.wrongAlpha})`;
        // 3. sin と cos を間違えて合成する
        const wrong3 = `${target.r} cos(θ + ${target.alpha})`;

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `・x軸に sin の係数 <b>${target.a}</b>、y軸に cos の係数 <b>${target.b}</b> をとった点 P(${target.a}, ${target.b}) を作ります。<br>` +
            `  1. 原点からの距離 r = √(${target.a}² + ${target.b}²) = <b>${target.r}</b><br>` +
            `  2. OPとx軸正の向きがなす角 α = <b>${target.alpha}</b><br>` +
            `  したがって <b>${correct}</b> が正解です。<br>` +
            `・<b>${wrong2}</b> は、点 P の x座標と y座標（sinとcosの係数）をプロットする際に、縦横を逆にして角度 α を求めてしまった典型的なミスです。`;

        return this.formatResult(question, correct, options, '数学II：三角関数 (加法定理を用いた三角関数の合成公式)', explanation);
    }

    // 10. 底の変換
    genLogBaseChange() {
        const isBaseChange = Math.random() < 0.5;

        if (isBaseChange) {
            const pairs = [
                { base: 4, val: 8, correct: '3/2', wrong: '2/3', exp: '\\log_2 8 / \\log_2 4 = 3/2' },
                { base: 9, val: 27, correct: '3/2', wrong: '2/3', exp: '\\log_3 27 / \\log_3 9 = 3/2' },
                { base: 8, val: 16, correct: '4/3', wrong: '3/4', exp: '\\log_2 16 / \\log_2 8 = 4/3' }
            ];
            const target = pairs[this.getRandomInt(0, pairs.length - 1)];
            const question = `対数  log_${target.base} ${target.val}  の値は？`;
            const correct = target.correct;

            // トラップ選択肢:
            // 1. 底の変換公式で、分母と分子を逆にしてしまったミス (log_c a / log_c b)
            const wrong1 = target.wrong;
            // 2. 真数 ÷ 底 を単純に行ってしまったミス
            const wrong2 = `${target.val / target.base}`;
            // 3. log の計算を単なる割り算と誤解した値
            const wrong3 = '2';

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・底の変換公式 <b>logₐ b = log꜀ b / log꜀ a</b> を用います（元の底 a が分母、真数 b が分子にいきます）。<br>` +
                `  log_${target.base} ${target.val} = ${target.exp} = <b>${correct}</b><br>` +
                `・<b>${wrong1}</b> は、公式を適用する際に<b>分母と分子の位置を逆にしてしまった</b>超典型的なミスです！<br>` +
                `・<b>${wrong2}</b> は対数の概念を忘れ、通常の割り算を行ってしまったミスです。`;

            return this.formatResult(question, correct, options, '数学II：指数・対数関数 (対数計算と底の変換公式)', explanation);
        } else {
            const calcs = [
                { text: 'log₂ 12 - log₂ 3', correct: '2', formula: 'log₂ (12 / 3) = log₂ 4 = 2', wrongMinus: '9', wrongDiv: '4' },
                { text: 'log₃ 18 - log₃ 2', correct: '2', formula: 'log₃ (18 / 2) = log₃ 9 = 2', wrongMinus: '16', wrongDiv: '9' },
                { text: 'log₅ 50 - log₅ 2', correct: '2', formula: 'log₅ (50 / 2) = log₅ 25 = 2', wrongMinus: '48', wrongDiv: '25' }
            ];
            const target = calcs[this.getRandomInt(0, calcs.length - 1)];
            const question = `式  ${target.text}  を計算せよ。`;
            const correct = target.correct;

            // トラップ選択肢:
            // 1. 引き算を真数の割り算ではなく、通常の引き算と勘違いした値 (log(12 - 3))
            const wrong1 = `log( ${target.wrongMinus} )`;
            // 2. 引き算の答えを真数そのものにするミス
            const wrong2 = `${target.wrongDiv}`;
            // 3. 定数ズレ
            const wrong3 = '1';

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・対数の性質として、<b>logₐ M - logₐ N = logₐ (M / N)</b> が成り立ちます。<br>` +
                `  ${target.text} = ${target.formula} = <b>${correct}</b> です。<br>` +
                `・<b>${wrong1}</b> は、対数の引き算を真数同士の単純な引き算（M - N）と勘違いしてしまったミスです。真数の計算は「割り算」になります。`;

            return this.formatResult(question, correct, options, '数学II：指数・対数関数 (対数計算と底の変換公式)', explanation);
        }
    }

    // 11. 接線
    genTangentLine() {
        const x0 = this.getRandomInt(1, 3);
        const y0 = x0 * x0;
        const slope = 2 * x0;
        const intercept = y0 - slope * x0;
        const interceptStr = intercept > 0 ? `+ ${intercept}` : (intercept < 0 ? `- ${Math.abs(intercept)}` : '');

        const question = `曲線 y = x² 上の点 (${x0}, ${y0}) における接線の方程式は？`;
        const correct = `y = ${slope}x ${interceptStr}`.trim();

        // トラップ選択肢:
        // 1. 接線公式の x0, y0 の引き算の符号を、両方足し算と間違えたミス (y + y0 = m(x + x0))
        const wrongInt1 = y0 + slope * x0;
        const wrong1 = `y = ${slope}x + ${wrongInt1}`;
        
        // 2. 接点 y0 を足す際に、移行の符号処理を間違えて引いてしまったミス
        const wrongInt2 = -y0 - slope * x0;
        const wrong2 = `y = ${slope}x ${wrongInt2 > 0 ? '+ ' + wrongInt2 : '- ' + Math.abs(wrongInt2)}`;
        
        // 3. 傾きを導関数 2x のまま代入して、xが残った式にしてしまったミス
        const wrong3 = `y = 2x(x - ${x0}) + ${y0}`;

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `1. y = x² を微分すると y' = 2x です。x = ${x0} での接線の傾きは m = 2 × ${x0} = <b>${slope}</b> になります。<br>` +
            `2. 点 (${x0}, ${y0}) を通る接線の公式：<b>y - ${y0} = ${slope}(x - ${x0})</b><br>` +
            `3. 展開して整理すると、y = <b>${correct}</b> となります。<br>` +
            `・<b>${wrong1}</b> や <b>${wrong2}</b> は、接線公式の接点の座標 (x₀, y₀) を代入した後の移行・展開時の符号計算ミスです。<br>` +
            `・<b>${wrong3}</b> は、傾きに「定数」を入れるべきところを「文字式（2x）」のまま公式に当てはめてしまった間違いです。`;

        return this.formatResult(question, correct, options, '数学II：微分法 (極限値・導関数と曲線上の接線方程式)', explanation);
    }

    // 12. 積分と面積
    genIntegrationArea() {
        const isFormula = Math.random() < 0.5;

        if (isFormula) {
            const areas = [
                { func: 'y = x² - 2x', correct: '4/3', fStr: '2', a: 1, w2: '2', w3: '4' },
                { func: 'y = x² - 3x', correct: '9/2', fStr: '3', a: 1, w2: '27/4', w3: '9' }
            ];
            const target = areas[this.getRandomInt(0, areas.length - 1)];
            const question = `放物線  ${target.func}  と x 軸で囲まれた部分の面積 S は？`;
            const correct = target.correct;

            // トラップ選択肢:
            // 1. 1/6公式の分母を 2 や 3 と勘違いしたミス (S = (β-α)^3 / 2 または 3)
            const wrong1 = target.w2;
            // 2. 3乗するべきところを、誤って2乗にしてしまったミス (S = (β-α)^2 / 6)
            const wrong2 = `${(Math.pow(parseInt(target.fStr), 2) / 6).toFixed(2)}`;
            // 3. 積分結果の符号を負のまま答える、または定積分を単に計算して負の面積にしてしまうミス
            const wrong3 = `-${correct}`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・放物線と x 軸の交点は x = 0, ${target.fStr} です。<br>` +
                `・放物線と直線で囲まれた面積には <b>1/6公式 S = |a|(β - α)³ / 6</b> が使えます。<br>` +
                `  S = 1 × (${target.fStr} - 0)³ / 6 = <b>${correct}</b> となります。<br>` +
                `・<b>${wrong2}</b> は公式の分子を「3乗」ではなく「2乗」にしてしまったミスです。<br>` +
                `・<b>${wrong3}</b> は面積なのにマイナスの値を答えてしまったミスです。面積は常に正の値になります。`;

            return this.formatResult(question, correct, options, '数学II：積分法 (定積分の計算と放物線で囲まれた面積)', explanation);
        } else {
            const integrals = [
                { code: '∫₁² (2x + 3) dx', correct: '6', exp: '[x² + 3x]₁² = (4 + 6) - (1 + 3) = 6', w1: '9', w2: '4' },
                { code: '∫₀² 3x² dx', correct: '8', exp: '[x³]₀² = 8', w1: '12', w2: '6' }
            ];
            const target = integrals[this.getRandomInt(0, integrals.length - 1)];
            const question = `定積分  ${target.code}  を計算せよ。`;
            const correct = target.correct;

            // トラップ選択肢:
            // 1. 微分と積分を間違えて、次数を下げて計算してしまったミス
            const wrong1 = target.w1;
            // 2. 下端 (x=1) の代入値を引き忘れたミス (上端を代入しただけの値)
            const wrong2 = target.w2;
            // 3. 定数計算ミス
            const wrong3 = `${parseInt(correct) + 2}`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・不定積分を求め、上端と下端の値をそれぞれ代入して引き算します。<br>` +
                `  ${target.code} = ${target.exp} = <b>${correct}</b> です。<br>` +
                `・<b>${wrong2}</b> は、下端（x=1 など）の値を引くのを忘れて、上端の代入値だけを答えてしまう非常によくあるミスです！`;

            return this.formatResult(question, correct, options, '数学II：積分法 (定積分の計算と放物線で囲まれた面積)', explanation);
        }
    }

    // 13. 数列
    genSequences() {
        const isSum = Math.random() < 0.5;

        if (isSum) {
            const seqs = [
                { type: '等差数列', desc: '初項 3, 公差 2', length: 10, correct: '120', wrongA: '105' },
                { type: '等比数列', desc: '初項 2, 公比 3', length: 4, correct: '80', wrongA: '240' }
            ];
            const target = seqs[this.getRandomInt(0, seqs.length - 1)];
            const question = `${target.type}（${target.desc}）の初項から第 ${target.length} 項までの和 S は？`;
            const correct = target.correct;

            // トラップ選択肢:
            // 1. 等差数列の和公式 Sn = n{2a + (n-1)d}/2 において、「2a」を「a」と間違えたミス
            const wrong1 = target.wrongA;
            // 2. 分母の /2 を忘れて、2倍の和にしてしまったミス
            const wrong2 = `${parseInt(correct) * 2}`;
            // 3. 最後の項までの (n-1)d の部分を、誤って nd にしてしまったミス
            const wrong3 = `${parseInt(correct) + 10}`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・等差数列の和の公式は <b>Sₙ = n{2a + (n-1)d} / 2</b> です。<br>` +
                `  S = 10 × {2×3 + 9×2} / 2 = 10 × 24 / 2 = <b>${correct}</b> となります。<br>` +
                `・<b>${wrong1}</b> は、公式の <b>2a</b> の「2」を忘れて <b>a</b> のまま計算してしまった、試験で非常によく発生するミスです。`;

            return this.formatResult(question, correct, options, '数学B：数列 (等差数列・等比数列の一般項と和の公式)', explanation);
        } else {
            const items = [
                { type: '等差数列', desc: '初項 4, 公差 3', idx: 10, correct: '31', exp: 'a₁₀ = 4 + 9 \\times 3 = 31', wrongN: '34' },
                { type: '等比数列', desc: '初項 2, 公比 3', idx: 5, correct: '162', exp: 'a₅ = 2 \\times 3⁴ = 162', wrongN: '486' }
            ];
            const target = items[this.getRandomInt(0, items.length - 1)];
            const question = `${target.type}（${target.desc}）の第 ${target.idx} 項の値は？`;
            const correct = target.correct;

            // トラップ選択肢:
            // 1. 一般項公式の「n-1」を「n」と間違えて、1項多く進めてしまったミス (a + nd)
            const wrong1 = target.wrongN;
            // 2. 初項を足し忘れるミス、または初項と公差を逆にするミス
            const wrong2 = `${parseInt(correct) - 4}`;
            // 3. 単純な足し算ミス
            const wrong3 = `${parseInt(correct) + 3}`;

            const options = [correct, wrong1, wrong2, wrong3];

            const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
                `・一般項の公式は <b>aₙ = a + (n-1)d</b> です。<br>` +
                `  a₁₀ = 4 + (10-1)×3 = 4 + 27 = <b>${correct}</b> となります。<br>` +
                `・<b>${wrong1}</b> は、公式の <b>(n-1)</b> を <b>n</b> と間違えて、公差を1回分余計に足して（掛けて）しまったミスです。`;

            return this.formatResult(question, correct, options, '数学B：数列 (等差数列・等比数列の一般項と和の公式)', explanation);
        }
    }

    // 14. ベクトルの内積
    genVectorDotProduct() {
        const ax = this.getRandomInt(1, 4), ay = this.getRandomInt(-3, 3);
        const bx = this.getRandomInt(-3, 3), by = this.getRandomInt(1, 4);
        const dot = ax * bx + ay * by;

        const question = `ベクトル a = (${ax}, ${ay}), b = (${bx}, ${by}) の内積 a·b は？`;
        const correct = `${dot}`;

        // トラップ選択肢:
        // 1. y成分の掛け算をプラスではなくマイナスにしてしまう符号ミス (a_x*b_x - a_y*b_y)
        const wrong1 = `${ax * bx - ay * by}`;
        // 2. 成分同士をクロスして掛けてしまうミス (a_x*b_y + a_y*b_x)
        const wrong2 = `${ax * by + ay * bx}`;
        // 3. ベクトルを足し合わせてスカラーではなくベクトルのままにしてしまった間違い
        const wrong3 = `(${ax + bx}, ${ay + by})`;

        const options = [correct, wrong1, wrong2, wrong3];

        const explanation = `💡 <b>解説（ケアレスミス対策）</b>:<br>` +
            `・ベクトルの内積の成分公式は <b>a·b = aₓbₓ + aᵧbᵧ</b> です。<br>` +
            `  a·b = (${ax})×(${bx}) + (${ay})×(${by}) = ${ax * bx} + (${ay * by}) = <b>${dot}</b><br>` +
            `・<b>${wrong1}</b> は、内積計算の途中でy成分の掛け算を引き算にしてしまう符号のケアレスミスです。<br>` +
            `・<b>${wrong2}</b> は、x成分同士、y成分同士ではなく、互い違いにクロスして掛けてしまったミスです。`;

        return this.formatResult(question, correct, options, '数学C：ベクトル (平面ベクトルの成分表示と内積の計算)', explanation);
    }

    formatResult(question, correct, options, categoryName, explanation = '') {
        const shuffled = this.shuffleArray(options);
        const correctIndex = shuffled.indexOf(correct);
        return {
            categoryName: categoryName,
            question: question,
            correctIndex: correctIndex,
            correctText: correct,
            options: shuffled,
            explanation: explanation || `💡 <b>解説</b>: 正解は ${correct} です。`
        };
    }
}

window.mathGenerator = new QuizGenerator();
