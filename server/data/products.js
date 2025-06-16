// ===== server/data/products.js (PHIÊN BẢN ĐẦY ĐỦ VÀ ỔN ĐỊNH) =====

const sampleUserId = '60d0fe4f5311236168a109ca'; 

const products = [
    // =========== GUITAR ================
    {
        name: 'Đàn guitar Acoustic Taylor 214ce',
        price: 35000000,
        originalPrice: 38500000,
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106945?q=80&w=1920&auto=format&fit=crop',
        brand: 'Taylor',
        mainCategory: 'guitar',
        subCategory: 'acoustic',
        description: 'Dáng Grand Auditorium, mặt gỗ Sitka Spruce, lưng và hông Rosewood.',
        fullDescription: 'Taylor 214ce là một trong những mẫu đàn bán chạy nhất của Taylor, nổi tiếng với âm thanh cân bằng, rõ ràng và khả năng chơi linh hoạt. Hệ thống pickup ES2 độc quyền tái tạo âm thanh mộc một cách trung thực nhất khi kết nối ra loa.',
        isPromotional: true,
        countInStock: 8,
        images: [
            'https://images.unsplash.com/photo-1525457426-345f2d285813?q=80&w=1920&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1549297184-3c58de2a6652?q=80&w=1920&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1562094254-182d3c1234b3?q=80&w=1920&auto=format&fit=crop'
        ],
        warranty: '24 tháng (chính hãng)',
        youtubeLink: 'https://www.youtube.com/watch?v=kpgb2y5tASc',
        specifications: [
            { key: 'Dáng đàn', value: 'Grand Auditorium' },
            { key: 'Gỗ mặt', value: 'Solid Sitka Spruce' },
            { key: 'Gỗ lưng & hông', value: 'Layered Indian Rosewood' },
            { key: 'Cần đàn', value: 'Tropical Mahogany' },
            { key: 'Electronics', value: 'Expression System 2 (ES2)' },
            { key: 'Dây đàn', value: 'Elixir Phosphor Bronze Light' }
        ],
        reviews: [
            { user: sampleUserId, name: 'Anh Tuấn', rating: 5, comment: 'Âm thanh tuyệt vời, rất đáng tiền. Cây đàn đẹp và hoàn thiện tỉ mỉ.' },
            { user: sampleUserId, name: 'Minh Hằng', rating: 4, comment: 'Action hơi cao so với mình một chút, nhưng sau khi chỉnh lại thì chơi rất êm.' }
        ]
    },
    {
        name: 'Đàn guitar Điện Fender Stratocaster Player',
        price: 21000000,
        originalPrice: 22500000,
        image: 'https://images.unsplash.com/photo-1521939094-5535234241B2?q=80&w=1920&auto=format&fit=crop',
        brand: 'Fender',
        mainCategory: 'guitar',
        subCategory: 'electric',
        description: 'Biểu tượng rock & blues, âm thanh linh hoạt, thiết kế hiện đại.',
        fullDescription: 'Fender Player Series Stratocaster mang đến âm thanh và phong cách Fender kinh điển với một chút hiện đại. Cấu hình 3 pickup single-coil Alnico 5 cho âm thanh trong trẻo, mạnh mẽ, phù hợp với mọi thể loại.',
        isPromotional: true,
        countInStock: 7,
        images: [
            'https://images.unsplash.com/photo-1629910435287-4c4754714446?q=80&w=1920&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1614741118873-a2a43a29e9df?q=80&w=1920&auto=format&fit=crop'
        ],
        warranty: '12 tháng',
        youtubeLink: 'https://www.youtube.com/watch?v=0gQZg-22w6w',
        specifications: [
            { key: 'Gỗ thân', value: 'Alder' },
            { key: 'Finish thân', value: 'Gloss Polyester' },
            { key: 'Chất liệu cần', value: 'Maple' },
            { key: 'Dáng cần', value: 'Modern "C"' },
            { key: 'Số phím', value: '22, Medium Jumbo' },
            { key: 'Pickup', value: 'Player Series Alnico 5 Strat® Single-Coil' }
        ],
        reviews: [
            { user: sampleUserId, name: 'Quốc Bảo', rating: 5, comment: 'Chất âm Fender không thể lẫn vào đâu được. Cần đàn mượt, chơi rất sướng tay!' }
        ]
    },
    {
        name: 'Đàn guitar Classic Cordoba C5',
        price: 8500000,
        image: 'https://images.unsplash.com/photo-1598993881263-fd505d53c3e8?q=80&w=1920&auto=format&fit=crop',
        brand: 'Cordoba',
        mainCategory: 'guitar',
        subCategory: 'classic',
        description: 'Cây đàn lý tưởng cho người học cổ điển, mặt gỗ Cedar, âm thanh ấm.',
        fullDescription: 'Cordoba C5 là một trong những cây đàn classic được khuyên dùng nhiều nhất cho người mới bắt đầu và trình độ trung cấp. Mặt top làm từ gỗ Cedar nguyên tấm mang lại chất âm ấm áp, ngọt ngào đặc trưng của dòng nhạc cổ điển.',
        isPromotional: false,
        countInStock: 12,
        images: [],
        warranty: '12 tháng',
        youtubeLink: 'https://www.youtube.com/watch?v=G3Q-P7n5-zM',
        specifications: [],
        reviews: []
    },
     {
        name: 'Đàn guitar Điện Gibson Les Paul Standard \'60s',
        price: 75000000,
        image: 'https://images.unsplash.com/photo-1605021955363-f22217e94114?q=80&w=1920&auto=format&fit=crop',
        brand: 'Gibson',
        mainCategory: 'guitar',
        subCategory: 'electric',
        description: 'Âm thanh rock dày và mạnh mẽ, pickup BurstBucker, vẻ đẹp cổ điển.',
        fullDescription: 'Gibson Les Paul Standard \'60s tái hiện lại linh hồn của những cây đàn Les Paul huyền thoại. Với cặp pickup BurstBucker 61, nó tạo ra chất âm dày, ấm và đầy nội lực, là âm thanh nền tảng của nhạc Rock.',
        isPromotional: false,
        countInStock: 3,
        images: [
            'https://images.unsplash.com/photo-1574258941543-5c7604f3621b?q=80&w=1920&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1605021955325-3a8761219088?q=80&w=1920&auto=format&fit=crop'
        ],
        warranty: 'Trọn đời',
        youtubeLink: 'https://www.youtube.com/watch?v=AtyA-D-yO-M',
        specifications: [],
        reviews: []
    },
    // =========== PIANO =================
    {
        name: 'Piano Điện Roland FP-30X',
        price: 22000000,
        originalPrice: 24000000,
        image: 'https://images.unsplash.com/photo-1571974599782-876246a84b49?q=80&w=1920&auto=format&fit=crop',
        brand: 'Roland',
        mainCategory: 'piano',
        subCategory: 'digital',
        description: 'Âm thanh SuperNATURAL, bàn phím PHA-4 Standard, kết nối Bluetooth.',
        fullDescription: 'Roland FP-30X nổi bật với công nghệ âm thanh SuperNATURAL cho chất âm sống động và biểu cảm. Bàn phím PHA-4 với cơ chế escapement và bề mặt ngà voi tổng hợp mang lại cảm giác chơi chân thực.',
        isPromotional: true,
        countInStock: 6,
        images: [
            'https://images.unsplash.com/photo-1628921868472-8a49335ab070?q=80&w=1920&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1601362840049-970d43343a41?q=80&w=1920&auto=format&fit=crop'
        ],
        warranty: '24 tháng',
        youtubeLink: 'https://www.youtube.com/watch?v=sI-38Lz4yN4',
        specifications: [],
        reviews: [
            { user: sampleUserId, name: 'Thanh Mai', rating: 5, comment: 'Cảm giác phím rất thật, âm thanh hay. Kết nối bluetooth với app học piano rất tiện lợi.' }
        ]
    },
    {
        name: 'Piano Cơ Upright Kawai K300',
        price: 150000000,
        image: 'https://images.unsplash.com/photo-1598322339599-311624bc056b?q=80&w=1920&auto=format&fit=crop',
        brand: 'Kawai',
        mainCategory: 'piano',
        subCategory: 'upright',
        description: 'Âm thanh chuyên nghiệp, bộ máy Millennium III Action độc quyền.',
        fullDescription: 'Kawai K-300 là một trong những cây đàn piano upright được yêu thích nhất thế giới. Bộ máy Millennium III Action sử dụng vật liệu ABS-Carbon siêu nhẹ và cứng, mang lại tốc độ phản hồi phím đáng kinh ngạc.',
        isPromotional: false,
        countInStock: 2,
        images: [],
        warranty: '5 năm',
        youtubeLink: '',
        specifications: [],
        reviews: []
    },
    // =========== DRUMS =================
    {
        name: 'Bộ Trống Tama Imperialstar',
        price: 23500000,
        image: 'https://images.unsplash.com/photo-1531315335759-b15334e3daf6?q=80&w=1920&auto=format&fit=crop',
        brand: 'Tama',
        mainCategory: 'drums',
        subCategory: 'acoustic-kit',
        description: 'Bộ trống chất lượng cao, đi kèm cymbal Meinl HCS.',
        fullDescription: 'Tama Imperialstar là một cái tên uy tín trong thế giới trống. Bộ trống này cung cấp chất lượng vượt trội trong tầm giá, với vỏ trống làm từ gỗ Poplar cho âm thanh ấm và đầy. Điểm nhấn là bộ cymbal Meinl HCS đi kèm.',
        isPromotional: false,
        countInStock: 4,
        images: [],
        warranty: '12 tháng',
        youtubeLink: '',
        specifications: [],
        reviews: []
    },
    {
        name: 'Trống Điện Roland TD-07DMK',
        price: 26000000,
        originalPrice: 27500000,
        image: 'https://images.unsplash.com/photo-1599481356767-3ddc337446ae?q=80&w=1920&auto=format&fit=crop',
        brand: 'Roland',
        mainCategory: 'drums',
        subCategory: 'electronic-kit',
        description: 'Trống điện nhỏ gọn, mặt lưới cho cảm giác chơi chân thực, module mạnh mẽ.',
        fullDescription: 'Roland TD-07DMK là giải pháp hoàn hảo cho việc luyện tập tại nhà. Mặt trống lưới siêu tĩnh độc quyền của Roland mang lại cảm giác phản hồi như trống cơ nhưng không gây tiếng ồn. Module âm thanh tích hợp sẵn nhiều bộ trống chất lượng cao.',
        isPromotional: true,
        countInStock: 9,
        images: [
             'https://images.unsplash.com/photo-1524234140-71638a8b1a53?q=80&w=1920&auto=format&fit=crop'
        ],
        warranty: '12 tháng',
        youtubeLink: 'https://www.youtube.com/watch?v=yBEb2M_I_4s',
        specifications: [],
        reviews: []
    },
    // =========== UKULELE ===============
    {
        name: 'Ukulele Concert Kala KA-C',
        price: 2800000,
        originalPrice: 3100000,
        image: 'https://images.unsplash.com/photo-1558941252-96d4b5420d43?q=80&w=1920&auto=format&fit=crop',
        brand: 'Kala',
        mainCategory: 'ukulele',
        subCategory: 'concert',
        description: 'Dáng concert cho âm thanh đầy đặn hơn soprano, làm từ gỗ Mahogany.',
        fullDescription: 'Kala KA-C là một lựa chọn nâng cấp hoàn hảo từ dòng soprano. Kích thước lớn hơn một chút mang lại âm thanh to, ấm và đầy đặn hơn. Toàn bộ thân đàn được làm từ gỗ Mahogany, tạo ra chất âm ngọt ngào và mượt mà.',
        isPromotional: true,
        countInStock: 15,
        images: [],
        warranty: '6 tháng',
        youtubeLink: '',
        specifications: [],
        reviews: []
    },
    // =========== VIOLIN ================
    {
        name: 'Violin Acoustic Size 4/4',
        price: 3500000,
        image: 'https://images.unsplash.com/photo-1612225330847-64b187c33895?q=80&w=1920&auto=format&fit=crop',
        brand: 'Lazer',
        mainCategory: 'violin',
        subCategory: 'acoustic',
        description: 'Bộ violin đầy đủ phụ kiện, bao gồm hộp, vĩ và nhựa thông. Sẵn sàng để chơi.',
        fullDescription: 'Bộ violin size 4/4 này là lựa chọn lý tưởng cho người lớn hoặc thanh thiếu niên muốn học violin. Sản phẩm được làm từ gỗ phong và vân sam, cho ra âm thanh đạt chuẩn. Đi kèm là hộp cứng chống sốc, vĩ kéo và nhựa thông chất lượng.',
        isPromotional: false,
        countInStock: 11,
        images: [],
        warranty: '6 tháng',
        youtubeLink: '',
        specifications: [],
        reviews: []
    },
    // ======== WIND INSTRUMENTS =========
    {
        name: 'Kèn Saxophone Alto Selmer AS42',
        price: 65000000,
        image: 'https://images.unsplash.com/photo-1607973686344-f06d3335c3a2?q=80&w=1920&auto=format&fit=crop',
        brand: 'Selmer',
        mainCategory: 'wind',
        subCategory: 'saxophone',
        description: 'Sản xuất bởi Conn-Selmer, kết hợp giữa thiết kế Pháp và chế tác Mỹ.',
        fullDescription: 'Selmer AS42 là cây kèn saxophone chuyên nghiệp, được phát triển dựa trên thiết kế của những cây kèn Selmer Paris huyền thoại. Nó mang lại âm thanh ấm, dày và đầy biểu cảm, đáp ứng được yêu cầu của những nghệ sĩ khó tính nhất.',
        isPromotional: false,
        countInStock: 3,
        images: [],
        warranty: '24 tháng',
        youtubeLink: '',
        specifications: [],
        reviews: []
    }
];

// Hàm để tính toán lại rating và numReviews dựa trên mảng reviews
const updatedProducts = products.map(product => {
    if (product.reviews && product.reviews.length > 0) {
        const numReviews = product.reviews.length;
        const rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;
        return { ...product, numReviews, rating: parseFloat(rating.toFixed(1)) };
    }
    return { ...product, numReviews: 0, rating: 0 };
});

module.exports = updatedProducts;