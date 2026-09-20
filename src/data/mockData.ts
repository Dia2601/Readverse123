import {
  BookWork,
  CommunityQuote,
  DetectiveCase,
  DebateTopic,
  Planet,
  ConstellationItem,
  BookRecommendation,
  CreativeScenario,
} from "../types";

export const PLANETS: Planet[] = [
  {
    id: "explore",
    name: "Hành Tinh Trích Dẫn",
    subtitle: "Khám Phá & Lắng Nghe",
    icon: "📚",
    description: "Khám phá các trích dẫn sâu sắc, chia sẻ lời suy ngẫm và kết nối với cộng đồng độc giả trẻ.",
    color: "#0284c7",
    accentColor: "#38bdf8",
  },
  {
    id: "investigate",
    name: "Hành Tinh Thám Tử",
    subtitle: "Giải Mã & Thẩm Tra",
    icon: "🔍",
    description: "Truy tìm manh mối văn học, kiểm định tính xác thực của các luận điểm và đối thoại với AI thám tử.",
    color: "#7e22ce",
    accentColor: "#c084fc",
  },
  {
    id: "debate",
    name: "Hành Tinh Đấu Trí",
    subtitle: "Tranh Biện & Đa Chiều",
    icon: "⚔️",
    description: "Hai mặt trăng đại diện cho hai luồng tư tưởng. Trải qua 5 vòng đấu trí để rèn luyện tư duy phản biện.",
    color: "#1d4ed8",
    accentColor: "#60a5fa",
  },
  {
    id: "connect",
    name: "Hành Tinh Liên Kết",
    subtitle: "Mạng Lưới Tri Thức",
    icon: "🧩",
    description: "Nối tác phẩm → nhân vật → vấn đề thời đại để dệt nên các chòm sao tư tưởng rực rỡ.",
    color: "#0f766e",
    accentColor: "#2dd4bf",
  },
  {
    id: "create",
    name: "Hành Tinh Kiến Tạo",
    subtitle: "Vũ Trụ Song Song",
    icon: "✨",
    description: "Tái thiết cái kết tác phẩm, viết thư giấu kín hay mở ra một kịch bản 'Nếu như...' độc đáo.",
    color: "#be185d",
    accentColor: "#f472b6",
  },
];

export const INITIAL_READ_WORKS: BookWork[] = [
  {
    id: "kieu",
    title: "Truyện Kiều",
    author: "Nguyễn Du",
    category: "Văn học trung đại",
    shortSnippet: "Kiệt tác truyện thơ Nôm về thân phận con người và chữ tài - chữ mệnh.",
  },
  {
    id: "laohac",
    title: "Lão Hạc",
    author: "Nam Cao",
    category: "Hiện thực phê phán",
    shortSnippet: "Bức tranh xót xa về nhân phẩm người nông dân trước cách mạng.",
  },
  {
    id: "vonhat",
    title: "Vợ Nhặt",
    author: "Kim Lân",
    category: "Hiện thực cách mạng",
    shortSnippet: "Ánh sáng của tình người và khát vọng sống giữa nạn đói 1945.",
  },
  {
    id: "chipheo",
    title: "Chí Phèo",
    author: "Nam Cao",
    category: "Hiện thực phê phán",
    shortSnippet: "Bi kịch tha hóa và tiếng kêu đòi lương thiện xé lòng.",
  },
  {
    id: "hoangtube",
    title: "Hoàng Tử Bé",
    author: "Antoine de Saint-Exupéry",
    category: "Văn học thế giới",
    shortSnippet: "Những bài học dịu dàng về tình bạn, tình yêu và lăng kính trái tim.",
  },
  {
    id: "hoavang",
    title: "Tôi thấy hoa vàng trên cỏ xanh",
    author: "Nguyễn Nhật Ánh",
    category: "Văn học thiếu niên",
    shortSnippet: "Thế giới tuổi thơ trong veo đan xen những rung động đầu đời và lòng trắc ẩn.",
  },
  {
    id: "harrypotter",
    title: "Harry Potter",
    author: "J.K. Rowling",
    category: "Giả tưởng kỳ ảo",
    shortSnippet: "Hành trình lòng dũng cảm, tình bạn và sự lựa chọn vượt lên định mệnh.",
  },
  {
    id: "demen",
    title: "Dế Mèn phiêu lưu ký",
    author: "Tô Hoài",
    category: "Đồng thoại phiêu lưu",
    shortSnippet: "Bài học trưởng thành từ nông nổi tuổi trẻ đến lý tưởng kết đoàn.",
  },
  {
    id: "chiecthuyen",
    title: "Chiếc thuyền ngoài xa",
    author: "Nguyễn Minh Châu",
    category: "Văn học hiện đại",
    shortSnippet: "Cái nhìn đa diện về nghệ thuật và cuộc sống đầy nghịch lý trần trụi.",
  },
  {
    id: "beplua",
    title: "Bếp Lửa",
    author: "Bằng Việt",
    category: "Thơ hiện đại",
    shortSnippet: "Kỷ niệm tuổi thơ và ngọn lửa nồng đượm tình bà cháu thiêng liêng.",
  },
];

export const INTEREST_BADGES = [
  { id: "emotion", label: "Cảm xúc", icon: "❤️", desc: "Thấu hiểu rung cảm nội tâm" },
  { id: "humanity", label: "Con người", icon: "🧠", desc: "Tâm lý & bản tính nhân vật" },
  { id: "society", label: "Xã hội", icon: "🌎", desc: "Hiện thực & số phận thời đại" },
  { id: "mystery", label: "Bí ẩn", icon: "🔍", desc: "Manh mối & thông điệp ẩn" },
  { id: "adventure", label: "Phiêu lưu", icon: "✨", desc: "Hành trình khám phá chân trời mới" },
  { id: "philosophy", label: "Triết lý", icon: "💭", desc: "Ý nghĩa nhân sinh sâu sắc" },
  { id: "growth", label: "Trưởng thành", icon: "🌱", desc: "Vượt qua thử thách để lớn khôn" },
  { id: "friendship", label: "Tình bạn", icon: "👥", desc: "Sự đồng hành & gắn kết" },
  { id: "family", label: "Gia đình", icon: "🏠", desc: "Cội nguồn & tình thân ấm áp" },
  { id: "justice", label: "Công lý", icon: "⚖️", desc: "Lẽ phải & sự công bằng" },
];

export const INITIAL_QUOTES: CommunityQuote[] = [
  {
    id: "q1",
    workTitle: "Hoàng Tử Bé",
    author: "Antoine de Saint-Exupéry",
    quote: "Người ta chỉ nhìn thấy thật rõ bằng trái tim. Cái cốt yếu thì vô hình trước đôi mắt.",
    reflection: "Câu nói này nhắc nhở mình đừng bao giờ đánh giá một người chỉ qua vẻ ngoài hoặc điểm số học tập. Giá trị thật nằm ở sự chân thành bên trong.",
    userName: "Phi hành gia Hà Linh",
    userStyle: "🌙 Người Mộng Mơ",
    likes: 42,
    insights: 18,
    tags: ["Triết lý", "Cảm xúc", "Tình bạn"],
    comments: [
      {
        id: "c1",
        userName: "Sao Băng Minh",
        text: "Mỗi lần đọc lại mình đều thấy một ý mới!",
        timestamp: "10 phút trước",
      },
    ],
  },
  {
    id: "q2",
    workTitle: "Chí Phèo",
    author: "Nam Cao",
    quote: "Ai cho tao lương thiện? Làm thế nào cho mất được những vết mảnh chai trên mặt này?",
    reflection: "Đây không chỉ là tiếng gào của Chí Phèo mà là bi kịch của những ai muốn quay đầu nhưng bị định kiến xã hội đóng chặt cánh cửa.",
    userName: "Phi hành gia Tuấn Kiệt",
    userStyle: "⚡ Người Phản Biện",
    likes: 56,
    insights: 31,
    tags: ["Con người", "Xã hội", "Bí ẩn"],
    comments: [],
  },
  {
    id: "q3",
    workTitle: "Vợ Nhặt",
    author: "Kim Lân",
    quote: "Trong cái đói quay đói quắt, người ta không nghĩ đến cái chết, mà chỉ nghĩ đến sự sống.",
    reflection: "Khát vọng sống của con người Việt Nam thật phi thường. Dù trong cảnh khốn cùng, họ vẫn tìm thấy nhau để nương tựa.",
    userName: "Phi hành gia Mai Anh",
    userStyle: "🌱 Người Khám Phá",
    likes: 38,
    insights: 22,
    tags: ["Gia đình", "Xã hội", "Trưởng thành"],
    comments: [],
  },
];

export const INITIAL_DETECTIVE_CASES: DetectiveCase[] = [
  {
    id: "det-1",
    workTitle: "Chí Phèo",
    author: "Nam Cao",
    claim: "Tiếng chửi mở đầu của Chí Phèo không phải là lời mê sảng của một kẻ say, mà là một nỗ lực tuyệt vọng để kết nối với loài người.",
    context: "Chí Phèo say rượu đi về làng Vũ Đại, chửi trời, chửi đời, chửi cả làng, chửi đứa nào không chửi nhau với hắn, và cuối cùng chửi đứa sinh ra hắn.",
    guidingClues: [
      "Tại sao Chí tức tối khi không ai đáp lời?",
      "Hành động 'chửi nhau với hắn' đối với Chí có ý nghĩa gì?",
      "Người say bình thường có thứ tự chửi từ rộng đến hẹp như vậy không?",
    ],
    suggestedEvidences: [
      "Hắn vừa đi vừa chửi... Hắn chửi cả làng Vũ Đại. Nhưng cả làng Vũ Đại ai cũng nghĩ: 'Chắc nó trừ mình ra!'. Không ai lên tiếng cả.",
      "Tức thật! Ờ! Thế này thì tức thật! Tức chết đi được mất! Đã thế, hắn phải chửi cha đứa nào không chửi nhau với hắn!",
      "Chỉ có ba con chó dữ với một thằng say rượu! Mẹ kiếp! Thế có phí rượu không?",
    ],
  },
  {
    id: "det-2",
    workTitle: "Lão Hạc",
    author: "Nam Cao",
    claim: "Hành động bán Cậu Vàng của Lão Hạc không chỉ vì hết tiền nuôi, mà là một cuộc tự trừng phạt đầy giằng xé lương tâm.",
    context: "Sau trận ốm thập tử nhất sinh, mùa màng thất bát, Lão Hạc quyết định bán con chó kỷ vật của đứa con trai.",
    guidingClues: [
      "Nét mặt và đôi mắt của Lão Hạc khi kể lại việc bán chó cho ông giáo?",
      "Từ ngữ nào bộc lộ mặc cảm tội lỗi của một con người trung thực?",
    ],
    suggestedEvidences: [
      "Mặt lão đột nhiên co rúm lại. Những vết nhăn xô lại với nhau, ép cho nước mắt chảy ra...",
      "Khốn nạn... Ông giáo ơi! Nó có biết gì đâu! Nó thấy tôi gọi thì chạy ngay về... Thế là tôi già bằng này tuổi đầu rồi còn đánh lừa một con chó!",
    ],
  },
  {
    id: "det-3",
    workTitle: "Vợ Nhặt",
    author: "Kim Lân",
    claim: "Nồi cháo cám của bà cụ Tứ trong buổi sáng sau ngày cưới là biểu tượng của tình mẫu tử và niềm tin kiên cường vào tương lai, chứ không đơn thuần là nỗi khổ cực.",
    context: "Bữa cơm đón dâu đầu tiên giữa nạn đói 1945 chỉ có niêu cháo loãng và một nồi 'chè khoán' đắng chát.",
    guidingClues: [
      "Thái độ của bà cụ Tứ khi bưng nồi cháo ra?",
      "Bà cụ nói về viễn cảnh đàn gà như thế nào?",
    ],
    suggestedEvidences: [
      "Bà lão vừa ăn vừa kể chuyện làm ăn, gia cảnh với con dâu: 'Tràng ạ. Khi nào có tiền ta mua lấy đôi gà... này ngoảnh đi ngoảnh lại chả mấy mà có ngay đàn gà cho mà xem...'",
      "Bà lão lật đật chạy xuống bếp, lễ mễ bưng ra một cái nồi khói bốc lên nghi ngút... 'Chè khoán đây, ngon đáo để, cứ thử ăn mà xem!'",
    ],
  },
];

export const INITIAL_DEBATE_TOPICS: DebateTopic[] = [
  {
    id: "deb-1",
    workTitle: "Chí Phèo",
    author: "Nam Cao",
    dilemma: "Bi kịch tha hóa của Chí Phèo: Do hoàn cảnh xã hội đẩy đưa hay do sự suy đồi ý chí cá nhân?",
    stanceA: "Hoàn cảnh xã hội phong kiến, nhà tù thực dân và sự tàn độc của Bá Kiến là nguyên nhân tiên quyết tước đoạt nhân hình và nhân tính của Chí.",
    stanceB: "Chí Phèo vẫn có những khoảnh khắc thức tỉnh; việc buông xuôi đắm chìm trong men rượu và bạo lực có một phần trách nhiệm từ sự đầu hàng của bản thân.",
    contextPrompt: "Hãy chọn lập trường bạn muốn bảo vệ hoặc thử thách bản thân ở góc nhìn đối lập.",
  },
  {
    id: "deb-2",
    workTitle: "Chiếc thuyền ngoài xa",
    author: "Nguyễn Minh Châu",
    dilemma: "Người đàn bà hàng chài cam chịu đòn roi của chồng: Là sự nhu nhược đáng trách hay là đức hy sinh vĩ đại vì sự sống của đàn con?",
    stanceA: "Đó là sự cam chịu bảo thủ, dung dưỡng cho bạo lực gia đình và gieo rắc tổn thương tâm lý nặng nề lên tâm hồn đứa trẻ Phác.",
    stanceB: "Đó là bản lĩnh và sự hy sinh phi thường của tình mẫu tử giữa hoàn cảnh sống lênh đênh bão biển, nơi chiếc thuyền bắt buộc phải có một người đàn ông chèo chống.",
    contextPrompt: "Đâu là ranh giới giữa đức hy sinh và quyền tự bảo vệ nhân phẩm con người?",
  },
];

export const INITIAL_CONSTELLATIONS: ConstellationItem[] = [
  {
    id: "c1",
    name: "Chòm Sao Ánh Lửa",
    connectedThemes: ["Bếp Lửa", "Tình bà cháu", "Cội nguồn", "Sự ấm áp giữa gian khó"],
    description: "Ngọn lửa nhen nhóm từ bếp than nghèo đã trở thành ngọn lửa niềm tin soi sáng suốt cả cuộc đời người cháu trưởng thành nơi phương xa.",
    unlockedAt: "Hôm qua",
    color: "#f59e0b",
  },
  {
    id: "c2",
    name: "Chòm Sao Lương Thiện",
    connectedThemes: ["Chí Phèo", "Lão Hạc", "Nhân phẩm", "Khát vọng làm người"],
    description: "Dù trong bùn lầy tha hóa hay bên bờ vực chết đói, khát khao giữ trọn vẹn sự lương thiện vẫn sáng ngời như một bản năng cao quý nhất của con người.",
    unlockedAt: "Hôm nay",
    color: "#38bdf8",
  },
];

export const INITIAL_RECOMMENDATIONS: BookRecommendation[] = [
  {
    id: "rec-1",
    title: "Hoàng Tử Bé",
    author: "Antoine de Saint-Exupéry",
    whyRecommended: "Rất tương thích với phong cách chiêm nghiệm và trái tim yêu thương cái đẹp nội tâm của bạn.",
    themes: ["Trưởng thành", "Triết lý", "Tình bạn"],
    ponderQuestion: "Nếu một ngày gặp lại đứa trẻ 10 tuổi trong chính mình, bạn sẽ nói điều gì đầu tiên?",
    quoteSnippet: "Người ta chỉ nhìn thấy thật rõ bằng trái tim. Cái cốt yếu thì vô hình trước đôi mắt.",
  },
  {
    id: "rec-2",
    title: "Tôi thấy hoa vàng trên cỏ xanh",
    author: "Nguyễn Nhật Ánh",
    whyRecommended: "Giúp bạn mổ xẻ những góc khuất tâm lý rất đỗi chân thực của tuổi trẻ như lòng đố kỵ và sự hối hận.",
    themes: ["Cảm xúc", "Gia đình", "Con người"],
    ponderQuestion: "Lòng đố kỵ có phải là điều tự nhiên, và làm sao lòng trắc ẩn có thể hóa giải nó?",
    quoteSnippet: "Ngồi dưới bóng cây râm mát, nhìn những vạt nắng nhảy múa trên cỏ, tôi chợt thấy lòng mình nhẹ bẫng...",
  },
  {
    id: "rec-3",
    title: "Chiếc thuyền ngoài xa",
    author: "Nguyễn Minh Châu",
    whyRecommended: "Một tác phẩm hoàn hảo để tôi luyện tư duy đa chiều và nhận diện sự khác biệt giữa cái nhìn nghệ thuật lãng mạn và hiện thực gồ ghề.",
    themes: ["Xã hội", "Công lý", "Triết lý"],
    ponderQuestion: "Liệu một bức ảnh phong cảnh tuyệt mỹ có phản ánh trọn vẹn cuộc đời của những người trong bức ảnh đó?",
    quoteSnippet: "Không thể giản đơn và dễ dãi khi nhìn nhận con người và cuộc đời.",
  },
];

export const SUGGESTED_READING_WORKS: string[] = [
  "Vợ Nhặt",
  "Lão Hạc",
  "Chí Phèo",
  "Hai Đứa Trẻ",
  "Hoàng Tử Bé",
  "Truyện Kiều",
  "Chiếc Thuyền Ngoài Xa",
  "Tôi thấy hoa vàng trên cỏ xanh",
  "Số Đỏ",
  "Dế Mèn Phiêu Lưu Ký",
];

export const INITIAL_CREATIVE_SCENARIOS: CreativeScenario[] = [
  {
    id: "cre-1",
    workTitle: "Vợ Nhặt",
    author: "Kim Lân",
    title: "Nếu Tràng lưỡng lự không đẩy xe thóc cùng thị?",
    promptScenario: "Vào buổi chiều định mệnh ở dốc tỉnh, khi thị sầm sập chạy lại chì chiết, Tràng chợt nghĩ đến cảnh mẹ già ở nhà và im lặng bước đi...",
    characterFocus: "Tràng & Bà Cụ Tứ",
    inspirationalThought: "Liệu số phận của Tràng sẽ an toàn hơn, hay mất đi cơ hội duy nhất để chạm vào hạnh phúc?",
  },
  {
    id: "cre-2",
    workTitle: "Lão Hạc",
    author: "Nam Cao",
    title: "Bức thư Lão Hạc giấu dưới chân bát hương",
    promptScenario: "Trước đêm ăn bả chó, Lão Hạc đã nhờ ông giáo viết một lá thư gửi cho anh con trai đang làm đồn điền cao su...",
    characterFocus: "Lão Hạc & Anh con trai",
    inspirationalThought: "Những tâm sự nghẹn đắng chưa từng được kể của người cha già.",
  },
];
