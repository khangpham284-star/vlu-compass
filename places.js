// Source: the supplied VLU 2026 campus diagram. Locations use the same
// 1134 × 727 coordinate system as the source raster; no live POI data.
export const categories={food:'Ăn uống',sport:'Thể thao',parking:'Gửi xe',gate:'Cổng vào',other:'Khác'};
export const places=[
 {id:'starbucks',name:'Starbucks',category:'food',x:516,y:451,where:'Tầng 1 · Tòa J',detail:'Cà phê Starbucks nằm ở tầng 1 tòa J theo chú thích trên sơ đồ.',building:'J',mark:'☕'},
 {id:'ministop-f',name:'Ministop · Tòa F',category:'food',x:838,y:544,where:'Tòa F',detail:'Cửa hàng tiện lợi được đánh dấu tại tòa F trên sơ đồ.',building:'F',mark:'M'},
 {id:'ministop-gate',name:'Ministop · Cổng phụ',category:'food',x:791,y:670,where:'Cổng đường Dương Quảng Hàm',detail:'Điểm Ministop ở cổng phụ phía đường Dương Quảng Hàm.',mark:'M'},
 {id:'pool',name:'Hồ bơi',category:'sport',x:454,y:580,where:'Giữa tòa I và tòa G',detail:'Hồ bơi ở phía dưới khu sân thể thao trên sơ đồ.',mark:'≈'},
 {id:'court',name:'Sân bóng rổ, khu thể thao',category:'sport',x:490,y:502,where:'Phía dưới tòa J',detail:'Khu có viền nét đứt trên sơ đồ: phạm vi sử dụng có giới hạn đối tượng.',restricted:true,mark:'◇'},
 {id:'uts',name:'Khu vận động trường UTS',category:'sport',x:755,y:579,where:'Giữa tòa G và tòa F',detail:'Khu của trường UTS được đánh dấu bằng viền nét đứt trên sơ đồ.',restricted:true,mark:'◇'},
 {id:'b1-north',name:'Hầm xe B1 · phía tòa J',category:'parking',x:435,y:365,where:'Đường vòng phía trên tòa J',detail:'Một lối xuống hầm B1 nằm trên đường vòng, phía trên tòa J.',mark:'P'},
 {id:'b1-pool',name:'Hầm xe B1 · phía hồ bơi',category:'parking',x:482,y:542,where:'Giữa sân thể thao và hồ bơi',detail:'Vị trí hầm B1 cạnh hồ bơi được đánh dấu bằng viền nét đứt trên sơ đồ.',restricted:true,mark:'P'},
 {id:'b1-west',name:'Hầm xe B1 · phía tòa I',category:'parking',x:346,y:634,where:'Góc dưới tòa I',detail:'Lối xuống hầm B1 phía góc dưới tòa I, gần cổng Dương Quảng Hàm.',mark:'P'},
 {id:'b2',name:'Hầm xe B2',category:'parking',x:590,y:327,where:'Đường vòng, gần tòa J và tòa K',detail:'Lối hầm B2 ở đoạn đường vòng phía trên tòa J, bên trái tòa K.',mark:'P'},
 {id:'b3',name:'Hầm xe B3',category:'parking',x:907,y:634,where:'Giữa tòa F và tòa D',detail:'Hầm B3 ở khoảng giữa tòa F và D. Điểm QR 01 trong bản demo đặt tại lối lên phía trên.',mark:'P'},
 {id:'staff-parking',name:'Hầm xe CBNV',category:'parking',x:971,y:302,where:'Bên phải tòa A',detail:'Hầm xe dành cho cán bộ, nhân viên theo tên ghi trên sơ đồ.',restricted:true,mark:'P'},
 {id:'car-parking',name:'Bãi đỗ xe ô tô',category:'parking',x:454,y:615,where:'Phía dưới hồ bơi',detail:'Khu đỗ xe ô tô được vẽ ngay dưới hồ bơi.',mark:'P'},
 {id:'main-gate',name:'Cổng chính · Đặng Thùy Trâm',category:'gate',x:775,y:69,where:'Phía trên tòa A',detail:'Cổng vào chính từ đường Đặng Thùy Trâm.',mark:'↥'},
 {id:'creek-gate',name:'Cổng phụ · Ven rạch',category:'gate',x:634,y:252,where:'Bên trái tòa A',detail:'Cổng vào phụ từ đường ven rạch Xuyên Tâm.',mark:'↥'},
 {id:'southwest-gate',name:'Cổng phụ · Gần tòa I',category:'gate',x:342,y:666,where:'Đường Dương Quảng Hàm',detail:'Cổng phụ phía tòa I, nối ra đường Dương Quảng Hàm.',mark:'↥'},
 {id:'south-gate',name:'Cổng phụ · Gần tòa F',category:'gate',x:833,y:669,where:'Đường Dương Quảng Hàm',detail:'Cổng phụ gần tòa F và điểm Ministop, nối ra đường Dương Quảng Hàm.',mark:'↥'},
 {id:'water-k',name:'Hồ nước tòa K',category:'other',x:651,y:409,where:'Bao quanh tòa K',detail:'Các hồ nước nằm quanh tòa K ở trung tâm khuôn viên.',building:'K',mark:'≈'},
 {id:'b3-walkways',name:'Lối ống lồng xuống B3',category:'parking',x:674,y:464,where:'Bốn vị trí quanh tòa K',detail:'Bốn ký hiệu màu vàng cam quanh tòa K là các lối ống lồng xuống bãi giữ xe B3.',also:[[674,353],[795,353],[795,464]],mark:'P'},
 {id:'workshop',name:'Xưởng',category:'other',x:994,y:670,where:'Dọc đường phía dưới tòa D',detail:'Khu xưởng được ghi ở cạnh dưới bên phải của sơ đồ.',mark:'X'}
];
