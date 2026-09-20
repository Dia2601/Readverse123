export interface CanonicalWorkMetadata {
  id: string;
  title: string;
  author: string;
  periodOrCategory: string;
  context: string;
  characters: string[];
  originalSituationSummary: string;
  suggestedTurningPoints: {
    id: string;
    label: string;
    description: string;
    promptHint: string;
  }[];
  themes: string[];
}

export const CANONICAL_WORKS: Record<string, CanonicalWorkMetadata> = {
  "vợ nhặt": {
    id: "vonhat",
    title: "Vợ Nhặt",
    author: "Kim Lân",
    periodOrCategory: "Hiện thực cách mạng 1945",
    context: "Nạn đói Ất Dậu 1945 tại xóm ngụ cư u ám, bóng đen của cái chết bao trùm từng ngõ ngách, nhưng tình người và khát vọng sống vẫn âm ỉ trỗi dậy.",
    characters: ["Tràng", "Thị (người vợ nhặt)", "Bà cụ Tứ", "Trẻ con xóm ngụ cư", "Lý trưởng"],
    originalSituationSummary: "Tràng nghèo khổ, chỉ bằng bốn bát bánh đúc và vài câu đùa mà đưa người đàn bà xa lạ về làm vợ giữa nạn đói khốc liệt, khiến bà cụ Tứ vừa mừng vừa tủi trong bữa cháo cám đắng chát.",
    suggestedTurningPoints: [
      {
        id: "tp-vn-1",
        label: "Bát cháo cám & Lá cờ đỏ",
        description: "Khi nghe tiếng trống thúc thuế dồn dập và tiếng bàn tán về đoàn người phá kho thóc, Tràng không chỉ nghĩ trong đầu mà quyết định cùng Thị và trai làng hành động ngay sáng hôm ấy.",
        promptHint: "Nếu Tràng quyết định bước ra ngõ cùng đoàn người đi tìm sự sống thay vì chỉ nhìn thấy lá cờ đỏ bay phấp phới trong tâm trí...",
      },
      {
        id: "tp-vn-2",
        label: "Bốn bát bánh đúc san sẻ",
        description: "Trên đường đưa Thị về xóm ngụ cư, bắt gặp một đứa bé đói lả nằm gục bên vệ đường, Tràng và Thị cùng dừng lại san sẻ phần lương thực ít ỏi còn lại.",
        promptHint: "Hành động san sẻ sự sống ấy đã thay đổi ánh mắt của người dân xóm ngụ cư và số phận của đứa bé ra sao?",
      },
      {
        id: "tp-vn-3",
        label: "Lời tâm sự đêm tân hôn của Thị",
        description: "Đêm đầu tiên ở căn nhà rách nát, Thị mở lòng kể về gia đình thất lạc của mình ở quê cũ và khát vọng tìm lại người thân sau nạn đói.",
        promptHint: "Một lời hứa giữa hai con người khốn cùng dưới mái tranh dột nát...",
      },
    ],
    themes: ["Tình người", "Khát vọng sống", "Nạn đói 1945", "Sự đùm bọc"],
  },
  "lão hạc": {
    id: "laohac",
    title: "Lão Hạc",
    author: "Nam Cao",
    periodOrCategory: "Hiện thực phê phán trước 1945",
    context: "Làng quê Bắc Bộ nghèo đói trước 1945. Những người nông dân bị bần cùng hóa, lương thiện bị thử thách trước cái đói và bệnh tật.",
    characters: ["Lão Hạc", "Ông Giáo", "Cậu Vàng", "Con trai Lão Hạc (đi phu)", "Binh Tư", "Vợ ông Giáo"],
    originalSituationSummary: "Lão Hạc cô đơn côi cút giữ mảnh vườn cho con trai đi phu đồn điền cao su. Sau trận ốm kiệt quệ và bán cậu Vàng trong dằn vặt, lão chọn cái chết dữ dội bằng bả chó để giữ trọn nhân phẩm và gia sản cho con.",
    suggestedTurningPoints: [
      {
        id: "tp-lh-1",
        label: "Nhận lời giúp đỡ của ông Giáo",
        description: "Trước khi xin bả chó của Binh Tư, Lão Hạc xúc động trước sự chân thành của ông Giáo và chấp nhận cùng ông chia sẻ củ khoai, chén trà để kiên nhẫn chờ con trở về.",
        promptHint: "Nếu Lão Hạc không chọn cái chết đơn độc mà đồng ý để ông Giáo và chòm xóm cùng đỡ đần qua mùa giáp hạt...",
      },
      {
        id: "tp-lh-2",
        label: "Lá thư bất ngờ từ đồn điền cao su",
        description: "Đúng ngày định bán cậu Vàng, một người cùng làng trốn về mang theo lá thư và số tiền dành dụm của người con trai gửi cho bố.",
        promptHint: "Tin tức về người con đã làm bừng sáng gian nhà rạ xiêu vẹo của Lão Hạc như thế nào?",
      },
      {
        id: "tp-lh-3",
        label: "Cậu Vàng tìm được chủ mới tốt bụng",
        description: "Lão Hạc không bán cậu Vàng cho lò mổ mà gửi gắm nó cho một người yêu thương động vật trên tỉnh với lời hẹn chuộc lại.",
        promptHint: "Sự giải tỏa tâm lý tội lỗi đã giúp Lão Hạc có thêm dũng khí sống tiếp...",
      },
    ],
    themes: ["Lòng tự trọng", "Tình phụ tử", "Nhân phẩm", "Tình làng nghĩa xóm"],
  },
  "chí phèo": {
    id: "chipheo",
    title: "Chí Phèo",
    author: "Nam Cao",
    periodOrCategory: "Hiện thực phê phán trước 1945",
    context: "Làng Vũ Đại tù đọng, phân chia giai cấp ngột ngạt. Bọn địa chủ thâm độc biến người nông dân lương thiện thành tay sai lưu manh.",
    characters: ["Chí Phèo", "Thị Nở", "Bá Kiến", "Bà cô Thị Nở", "Binh Chức", "Lý Cường"],
    originalSituationSummary: "Chí Phèo từ nông dân hiền lành bị đẩy vào tù rồi tha hóa thành con quỷ dữ làng Vũ Đại. Bát cháo hành của Thị Nở đánh thức nhân tính, nhưng lời định kiến của bà cô khiến Chí bị cự tuyệt, dẫn tới kết cục giết Bá Kiến rồi tự sát.",
    suggestedTurningPoints: [
      {
        id: "tp-cp-1",
        label: "Thị Nở vượt qua định kiến bà cô",
        description: "Sau khi bị bà cô mắng mỏ, Thị Nở không quay lưng mà chạy ngược ra vườn chuối, nắm lấy bàn tay run rẩy của Chí Phèo và quyết tâm cùng Chí rời làng Vũ Đại.",
        promptHint: "Hai con người bị xã hội gạt ra ngoài lề cùng nhau tìm đến một vùng đất mới để làm lại cuộc đời...",
      },
      {
        id: "tp-cp-2",
        label: "Đòi lương thiện trước cổng làng",
        description: "Thay vì cầm dao đến nhà Bá Kiến đâm chém trong cơn say, Chí tỉnh táo đứng giữa cổng làng đòi lại danh dự và vạch trần tội ác của giai cấp thống trị trước toàn thể dân làng.",
        promptHint: "Tiếng thét 'Ai cho tao lương thiện?' vang lên không phải bằng bạo lực mà bằng tiếng gọi của công lý...",
      },
      {
        id: "tp-cp-3",
        label: "Tự tay dựng lại túp lều bên bờ sông",
        description: "Sau khi tỉnh rượu, Chí Phèo nhận ra mình không thể chết vô nghĩa, quyết tâm trồng lại luống chuối, bắt cá kiếm sống để chứng minh lòng lương thiện.",
        promptHint: "Hành trình đơn độc nhưng kiên cường của một con người giành lại bản thể người...",
      },
    ],
    themes: ["Khát vọng lương thiện", "Tình thương cứu rỗi", "Định kiến xã hội", "Nhân tính"],
  },
  "truyện kiều": {
    id: "kieu",
    title: "Truyện Kiều",
    author: "Nguyễn Du",
    periodOrCategory: "Văn học trung đại Việt Nam thế kỷ XVIII - XIX",
    context: "Xã hội phong kiến suy tàn, đồng tiền làm đảo lộn luân thường đạo lý, người phụ nữ tài hoa chịu nhiều bất hạnh đoạn trường.",
    characters: ["Thúy Kiều", "Kim Trọng", "Thúy Vân", "Vương Ông", "Từ Hải", "Mã Giám Sinh", "Hoạn Thư"],
    originalSituationSummary: "Gia đình gặp biến cố tai bay vạ gió, Kiều đành trao duyên cho em gái Thúy Vân rồi bán mình chuộc cha và em, dấn thân vào mười lăm năm lưu lạc đau thương.",
    suggestedTurningPoints: [
      {
        id: "tp-tk-1",
        label: "Chung sức giải oan trước quan lại",
        description: "Khi tai biến ập đến, Kiều cùng Thúy Vân và Vương Quan phối hợp tìm chứng cứ vạch trần âm mưu của thằng bán tơ, nhờ một vị quan thanh liêm phán xử công minh.",
        promptHint: "Nếu trí thông minh của chị em Kiều được vận dụng để bảo vệ gia đình thay vì cam chịu cảnh bán mình...",
      },
      {
        id: "tp-tk-2",
        label: "Khuyên Từ Hải không hàng triều đình",
        description: "Kiều nhận rõ dã tâm tráo trở của Hồ Tôn Hiến, kiên quyết khuyên Từ Hải giữ vững giang sơn cõi riêng của bậc anh hùng trượng phu.",
        promptHint: "Số phận của Từ Hải và Thúy Kiều sẽ vĩ đại thế nào nếu không mắc mưu chiêu an?",
      },
      {
        id: "tp-tk-3",
        label: "Hội ngộ Kim Trọng sau mười lăm năm",
        description: "Ngày đoàn viên, Kiều thanh thản mở trường dạy đàn và làm thơ cùng Kim Trọng, biến nỗi đau quá khứ thành sự khai sáng cho thế hệ sau.",
        promptHint: "Cái kết đoàn viên không gượng gạo mà đầy vẻ đẹp thanh tao của tâm hồn...",
      },
    ],
    themes: ["Chữ hiếu và chữ tình", "Định mệnh & Tự do", "Nhân phẩm phụ nữ", "Khát vọng công lý"],
  },
  "hai đứa trẻ": {
    id: "haiduate",
    title: "Hai Đứa Trẻ",
    author: "Thạch Lam",
    periodOrCategory: "Văn xuôi lãng mạn - hiện thực 1930 - 1945",
    context: "Phố huyện nghèo lúc chập tối trước Cách mạng. Cuộc sống quẩn quanh, tàn tạ, bóng tối nuốt chửng từng phận người nhỏ bé.",
    characters: ["Liên", "An", "Mẹ con chị Tí", "Bác Siêu", "Gia đình bác xẩm", "Hành khách trên tàu"],
    originalSituationSummary: "Chị em Liên và An trông nom gian hàng xén nhỏ xíu, tối nào cũng cố thức để chờ chuyến tàu đêm từ Hà Nội đi qua - khoảnh khắc rực rỡ hiếm hoi mang theo tia sáng của ước mơ xa vời.",
    suggestedTurningPoints: [
      {
        id: "tp-hdt-1",
        label: "Đoàn tàu đêm hỏng máy đỗ lại ga xép",
        description: "Đoàn tàu Hà Nội bất ngờ dừng lại ga phố huyện hơn nửa giờ. Một hành khách bước xuống quán xén của Liên, gửi tặng hai chị em cuốn sách đồng thoại và những câu chuyện về thế giới rộng lớn.",
        promptHint: "Món quà tinh thần ấy đã thắp lên ngọn lửa hy vọng và mở ra con đường học tập cho hai đứa trẻ ra sao?",
      },
      {
        id: "tp-hdt-2",
        label: "Gom góp mua đèn dầu thắp sáng phố huyện",
        description: "Liên và An rủ các bạn nhỏ trong phố huyện cùng nhau làm những chiếc đèn lồng giấy, thắp sáng cả khoảng sân ga tối tăm giữa đêm hè.",
        promptHint: "Ánh sáng do chính những đứa trẻ tạo nên thay vì thụ động chờ đợi chuyến tàu thoảng qua...",
      },
    ],
    themes: ["Ánh sáng và bóng tối", "Ước mơ tuổi thơ", "Lòng trắc ẩn", "Kiếp người nhỏ bé"],
  },
  "hoàng tử bé": {
    id: "hoangtube",
    title: "Hoàng Tử Bé",
    author: "Antoine de Saint-Exupéry",
    periodOrCategory: "Văn học thế giới - Triết lý nhân sinh",
    context: "Sa mạc Sahara bao la, nơi phi công gặp gỡ cậu bé tóc vàng đến từ tiểu hành tinh B612 xa xôi.",
    characters: ["Hoàng Tử Bé", "Người phi công", "Con cáo", "Bông hoa hồng", "Rắn vàng", "Con cừu"],
    originalSituationSummary: "Hoàng Tử Bé du hành qua nhiều hành tinh để tìm hiểu vũ trụ, thuần hóa con cáo và nhận ra trách nhiệm thiêng liêng với bông hồng của mình, trước khi để rắn cắn để linh hồn trở về tiểu hành tinh.",
    suggestedTurningPoints: [
      {
        id: "tp-htb-1",
        label: "Đưa người phi công cùng bay về tiểu tinh cầu B612",
        description: "Sau khi sửa xong máy bay, người phi công không chia tay cậu bé mà cùng cậu bay lên bầu trời đêm, ghé thăm B612 và cùng chăm sóc bông hồng kiêu kỳ.",
        promptHint: "Người lớn tìm lại được đứa trẻ bên trong mình và cùng bảo vệ bông hoa hồng...",
      },
      {
        id: "tp-htb-2",
        label: "Con cáo đi cùng Hoàng Tử Bé",
        description: "Trước khi rời Trái Đất, chú cáo được Hoàng Tử Bé rủ đi cùng, chứng minh rằng sự thuần hóa không kết thúc bằng sự chia ly mà bằng sự gắn bó vĩnh cửu.",
        promptHint: "Tình bạn vượt không gian giữa một cậu bé và người bạn tri kỷ...",
      },
    ],
    themes: ["Tình yêu & Trách nhiệm", "Lăng kính trái tim", "Sự thuần hóa", "Kỷ niệm tuổi thơ"],
  },
  "tôi thấy hoa vàng trên cỏ xanh": {
    id: "hoavang",
    title: "Tôi thấy hoa vàng trên cỏ xanh",
    author: "Nguyễn Nhật Ánh",
    periodOrCategory: "Văn học thiếu niên Việt Nam",
    context: "Làng quê miền Trung nghèo khó nhưng thơ mộng những năm 80, thế giới tuổi thơ mộc mạc với tình anh em và những rung động đầu đời.",
    characters: ["Thiều", "Tường", "Mận", "Thầy Nhâm", "Cô giáo Trinh", "Bố mẹ Thiều"],
    originalSituationSummary: "Thiều vì ghen tị trẻ con đã vô tình đánh gãy lưng em trai Tường hiền lành, mang theo nỗi ân hận cắn rứt sâu sắc cho đến khi hai anh em làm lành trong tình thương vô điều kiện.",
    suggestedTurningPoints: [
      {
        id: "tp-hvt-1",
        label: "Thiều thẳng thắn nhận lỗi ngay từ đầu",
        description: "Khi vừa vung chiếc gậy lên, Thiều kịp dừng lại, ôm chầm lấy Tường và thú nhận nỗi ghen tị ích kỷ trong lòng mình.",
        promptHint: "Sự dũng cảm đối diện với phần tối của bản thân đã giúp hai anh em trưởng thành sớm hơn như thế nào?",
      },
      {
        id: "tp-hvt-2",
        label: "Chế tạo cỗ xe lăn gỗ tặng Tường",
        description: "Trong những ngày Tường phải nằm một chỗ, Thiều cùng bọn trẻ trong xóm mày mò đóng một chiếc xe đẩy bằng gỗ để đưa Tường đi xem đồng hoa vàng nở rộ.",
        promptHint: "Tình anh em hàn gắn qua từng vết đinh và tiếng cười trên triền đê xanh ngát...",
      },
    ],
    themes: ["Tình anh em", "Lòng vị tha", "Trưởng thành", "Tuổi thơ trong trẻo"],
  },
  "chiếc thuyền ngoài xa": {
    id: "chiecthuyen",
    title: "Chiếc thuyền ngoài xa",
    author: "Nguyễn Minh Châu",
    periodOrCategory: "Văn học đổi mới sau 1975",
    context: "Vùng biển miền Trung sau chiến tranh. Cuộc sống mưu sinh nhọc nhằn của những người dân chài lưới và nghịch lý nghệ thuật - cuộc đời.",
    characters: ["Nhiếp ảnh gia Phùng", "Người đàn bà hàng chài", "Người đàn ông vũ phu", "Thằng Phác", "Chánh án Đẩu"],
    originalSituationSummary: "Phùng chụp được bức ảnh tuyệt bích chiếc thuyền trong sương sớm, nhưng ngay sau đó chứng kiến cảnh bạo lực gia đình tàn nhẫn và phát hiện sự thật đầy xót xa đằng sau sự cam chịu của người mẹ.",
    suggestedTurningPoints: [
      {
        id: "tp-ct-1",
        label: "Giải pháp hợp tác xã nghề cá giúp đỡ gia đình",
        description: "Sau phiên tòa, Phùng và Đẩu không chỉ dừng lại ở lời khuyên pháp lý mà kết nối với chính quyền địa phương để hỗ trợ chiếc thuyền lớn hơn và việc học hành của thằng Phác.",
        promptHint: "Khi nghệ thuật đi liền với hành động thiết thực để thay đổi số phận con người...",
      },
      {
        id: "tp-ct-2",
        label: "Bức ảnh thứ hai ghi lại nụ cười của mẹ con trên bãi biển",
        description: "Phùng chụp thêm một bức ảnh đời thường ấm áp khi người mẹ dạy con học chữ trên cát, triển lãm bức ảnh ấy bên cạnh bức tranh sương mù.",
        promptHint: "Cái nhìn toàn diện và giàu tình người của người nghệ sĩ trước đời sống...",
      },
    ],
    themes: ["Nghệ thuật & Cuộc đời", "Tình mẫu tử", "Sự thấu thị đa chiều", "Trách nhiệm xã hội"],
  },
};

export function getCanonicalWork(title: string): CanonicalWorkMetadata {
  const clean = (title || "").toLowerCase().trim();
  if (CANONICAL_WORKS[clean]) {
    return CANONICAL_WORKS[clean];
  }

  // Try partial match
  const foundKey = Object.keys(CANONICAL_WORKS).find((k) => clean.includes(k) || k.includes(clean));
  if (foundKey) {
    return CANONICAL_WORKS[foundKey];
  }

  // Fallback for custom works
  return {
    id: "custom-" + clean.replace(/\s+/g, "-"),
    title: title || "Tác phẩm được chọn",
    author: "Tác giả văn học",
    periodOrCategory: "Văn học & Tư duy sáng tạo",
    context: `Không gian và hoàn cảnh xã hội mang tính bước ngoặt trong "${title}".`,
    characters: ["Nhân vật chính", "Người bạn đồng hành", "Nhân vật đối trọng"],
    originalSituationSummary: `Tình huống cao trào thử thách bản lĩnh và phẩm giá của nhân vật trong tác phẩm "${title}".`,
    suggestedTurningPoints: [
      {
        id: "tp-custom-1",
        label: "Một lựa chọn khác tại thời khắc then chốt",
        description: `Nếu ở bước ngoặt cao trào của "${title}", nhân vật đưa ra quyết định khác biệt so với kết cục thông thường...`,
        promptHint: "Chi tiết đầu tiên thay đổi sẽ kéo theo những biến chuyển gì?",
      },
      {
        id: "tp-custom-2",
        label: "Sự xuất hiện của một người lắng nghe",
        description: "Một cuộc đối thoại chân thành giúp gỡ bỏ nút thắt tâm lý trước khi biến cố bi kịch xảy ra.",
        promptHint: "Lời nói nào có sức mạnh thay đổi cục diện?",
      },
    ],
    themes: ["Lựa chọn & Số phận", "Nhân phẩm", "Khát vọng tự do", "Góc nhìn đa chiều"],
  };
}
