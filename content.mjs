export const programs = [
  {slug:'community',num:'01',category:'보건소 · 복지관',title:'지역사회 바른 걷기',short:'주민의 일상에 가까운 걷기 교육',description:'보건소와 복지관의 지역주민을 위한 교육입니다. 족압과 보행 습관을 이해하고, 걷기와 근력·균형·유연성 운동을 함께 배웁니다.',audience:'보건소·지자체·노인복지관·지역 건강증진기관',image:'community',alt:'서호노인복지관 참여자들이 야외에서 균형운동을 배우는 모습',items:['올바른 걷기와 신발 선택에 관한 이론','족압·보행 특성을 살펴보는 측정 구성 협의','유연성·균형·근력운동과 걷기 실습','과정에 따른 사전·사후 측정 구성 협의'],cases:['seoho','gwonseon','jangan','yangju','pangyo','yangcheon','seocho-ai-walking','gunpo-fall-prevention'],note:'실내 강의와 야외 실습을 조합할 수 있습니다. 대상자의 특성, 현장 환경과 회차에 따라 내용을 협의합니다.'},
  {slug:'school',num:'02',category:'학교 · 청소년',title:'학생 바른자세·보행 교육',short:'자신의 발과 걸음을 이해하는 시간',description:'성장기 학생이 자신의 발과 보행 습관을 이해하도록 돕는 교육입니다. 학교 현장에서 족압 측정과 올바른 보행 교육을 진행하는 방식으로 구성합니다.',audience:'초·중·고등학교·교육기관·학생 건강증진 담당기관',image:'school',alt:'권선구보건소와 협회의 학생 바른 성장 프로젝트 안내문',items:['학생 눈높이에 맞춘 발과 보행 습관 이해','학교 방문 족압 측정 구성 협의','바른 자세와 올바른 보행을 위한 교육','학급 규모·장소에 맞춘 진행 방식 협의'],cases:['school-project','gyeonggi-education'],note:'학년, 학급 수, 교육 공간과 측정 장비 운영 여건을 먼저 확인합니다. 자세나 성장의 결과를 보장하는 과정은 아닙니다.'},
  {slug:'workplace',num:'03',category:'기업 · 임직원',title:'직장인 발 건강·걷기 교육',short:'일터에서 시작하는 바른 걷기 습관',description:'기업 임직원이 발과 보행을 이해하고 일상에서 활용할 걷기 방법을 배우는 교육입니다. 족압 분석과 걷기 교육을 기관의 운영 목적에 맞게 구성합니다.',audience:'기업 인사·복지·안전보건 담당 부서',image:'workplace',alt:'신세계 남산캠퍼스의 스마트 족압분석을 통한 올바른 보행 강의 안내',items:['족압과 보행 습관을 이해하는 강의','발 건강과 운동화 선택에 관한 교육','올바른 걷기 및 운동 실습 구성 협의','사내 강의·캠페인에 맞춘 현장 운영'],cases:['shinsegae','sbs','samsung','hyundai'],note:'근무 환경과 참여 인원에 따라 강의형 또는 측정·체험형으로 협의합니다. 구체적인 시간과 비용은 교육 구성에 따라 달라집니다.'},
  {slug:'experience',num:'04',category:'행사 · 건강 체험',title:'찾아가는 걷기·족압 체험',short:'현장에서 만나고, 직접 살펴보는 내 걸음',description:'지역 걷기축제와 건강 행사에서 족압 측정 및 보행 교육을 진행합니다. 행사 동선과 참여 규모를 고려해 체험 운영을 협의합니다.',audience:'지자체·지역 행사 주최기관·건강 캠페인 운영기관',image:'lecture',alt:'참여자들을 대상으로 진행하는 바른 걷기 교육 현장',items:['행사 공간과 예상 참여 인원 사전 협의','족압 측정 및 보행 특성 설명','올바른 걷기와 운동 방법 교육','현장 동선과 장비 운영 방식 협의'],cases:['yangcheon-marathon','ywca','anseong-festival','seocho-health','baby-expo','seongnam-senior','chuncheon-walking-festival','chuncheon-childcare','sillegil-walk'],note:'측정 가능 인원과 운영 방식은 행사 시간, 장비 수와 공간에 따라 결정합니다.'},
  {
    slug:'instructor', num:'05', category:'전문인력 교육', title:'바른자세걷기 강사 교육',
    short:'족압 분석을 바탕으로 배우는 올바른 보행 지도',
    description:'물리치료사와 걷기 교육 담당자가 스마트 족압 분석을 이해하고, 보행 지도와 신발 선택 교육에 활용하는 방법을 배웁니다.',
    audience:'물리치료사, 걷기 교육 담당자, 직능단체 및 교육 운영기관',
    eventPhoto:'instructor-demo', alt:'최영호 강사가 전남지부 강사양성과정에서 족압 분석 화면을 보며 설명하는 모습',
    items:[
      '스마트 족압 측정 결과를 읽고 보행 습관 살펴보기',
      '족압 분포와 자세의 관계를 이해하고 올바른 보행 방법 지도하기',
      '발에 맞는 신발을 고르는 기준과 맞지 않는 신발의 문제 설명하기',
    ],
    cases:['jeonnam-instructor-training'],
    note:'기관 교육은 참가자의 경험과 교육 목적에 맞춰 강의와 실습 범위를 협의합니다.',
  },
];
export const cases = [
  {slug:'seoho',category:'보건소 · 복지관',title:'걸어보자! 건강하게!',institution:'서호노인복지관',date:'2025.05–06',period:'2025년 5월 26일~6월 19일',audience:'서호노인복지관 노인 18명',eventPhoto:'seoho-group',alt:'서호노인복지관 걷기 프로그램 참가자들이 현수막을 들고 찍은 단체 사진',summary:'사전검사부터 걷기·운동 실습, 사후검사까지 함께한 4주 프로그램입니다.',body:'총 4주, 주 2회 일정으로 족압·보행 사전검사와 유연성·균형·근력운동, 사후검사를 구성했습니다. 복지관 인근 공원에서 참여자들과 운동 및 걷기 프로그램을 진행했습니다.',items:['족압측정·보행검사 등 사전검사','유연성·균형·근력운동과 걷기 프로그램','족압측정·보행검사 등 사후검사'],source:'협회 소개자료 26~32쪽',program:'community'},
  {slug:'school-project',category:'학교 · 청소년',title:'스마트 발걸음! 우리 아이 바른 성장 프로젝트',institution:'수원시 권선구보건소',date:'2026.09',period:'2026년 9월',audience:'권선구 관내 중학교 1학년 학생',image:'school',alt:'스마트 발걸음 우리 아이 바른 성장 프로젝트 사업 안내',summary:'학교로 찾아가 스마트 족압 측정과 올바른 보행 교육을 진행하는 학생 대상 사업입니다.',body:'사업 안내에 따르면 전문인력이 학교를 방문해 각 학급 교실 또는 교육실에서 교육을 진행하는 방식입니다. 자신의 발과 몸을 이해하도록 스마트 족압 측정 및 올바른 보행을 위한 교육을 구성했습니다.',items:['학교 방문형 교육','스마트 족압 측정','올바른 보행을 위한 교육'],source:'협회 소개자료 56쪽 및 첨부 사업 안내문',program:'school'},
  {slug:'shinsegae',category:'기업 · 임직원',title:'스마트 족압분석을 통한 올바른 보행',institution:'신세계그룹',date:'2026.07',period:'2026년 7월',audience:'임직원 15명',image:'workplace',alt:'신세계 남산캠퍼스의 족압분석 및 올바른 보행 강의 안내',summary:'임직원을 대상으로 스마트 족압분석과 올바른 보행을 다룬 교육입니다.',body:'협회 소개자료에 수록된 기업 교육 사례입니다. 스마트 족압분석을 통해 보행을 이해하고 올바른 보행 방법을 배우는 내용으로 진행했습니다.',items:['스마트 족압분석의 이해','올바른 보행 교육'],source:'협회 소개자료 51쪽',program:'workplace'},
  {slug:'gwonseon',category:'보건소 · 복지관',title:'어르신 건강걷기 교육',institution:'수원시 권선구보건소',date:'2026.05–06',period:'2026년 5월 8일~6월 12일, 6회',audience:'지역 어르신 20명',image:'outdoor',alt:'협회 어르신 걷기 프로그램의 야외 운동 현장 참고 사진',referencePhoto:true,summary:'공원과 산책로에서 걷기와 근력운동을 함께 배우는 어르신 대상 교육입니다.',body:'협회 소개자료에 따르면 지역 어르신을 대상으로 인근 공원 및 산책로에서 건강걷기, 올바른 걷기 및 근력운동 교육을 진행했습니다.',items:['인근 공원·산책로 건강걷기','올바른 걷기 및 근력운동 교육'],source:'협회 소개자료 50쪽',program:'community'},
  {slug:'jangan',category:'보건소 · 복지관',title:'도심 속 공원 건강 걷기',institution:'수원시 장안구보건소',date:'2025.10–11',period:'2025년 10월 31일~11월 21일',audience:'지역주민 15명',eventPhoto:'jangan-park-exercise',alt:'공원 운동기구 옆에서 함께 운동하는 건강 걷기 참가자들',summary:'지역 공원을 활용해 올바른 걷기와 근력운동을 진행한 프로그램입니다.',body:'주 1회, 4곳의 공원에서 지역주민과 함께 올바른 걷기 및 근력운동을 진행한 사례입니다.',items:['지역 공원 현장 교육','올바른 걷기','근력운동'],source:'협회 소개자료 48~49쪽',program:'community'},
  {slug:'sbs',category:'기업 · 임직원',title:'올바른 걷기 & 발 건강 프로그램',institution:'SBS방송국',date:'2026.05',period:'2026년 5월',audience:'임직원',eventPhoto:'sbs-walking-poster',poster:true,alt:'족압 검사, 일대일 상담과 걷기 교육을 안내하는 SBS 임직원 프로그램 포스터',summary:'임직원을 대상으로 올바른 걷기와 발 건강을 다룬 프로그램입니다.',body:'SBS방송국 임직원을 대상으로 올바른 걷기와 발 건강을 주제로 프로그램을 진행했습니다.',items:['올바른 걷기 교육','발 건강 프로그램'],source:'협회 소개자료 42쪽 및 임직원 프로그램 안내 포스터',program:'workplace'},
  {slug:'ywca',category:'행사 · 건강 체험',title:'시민걷기 축제 현장 봉사',institution:'서울YWCA',date:'2025.05',period:'2025년 5월 24일',audience:'시민걷기 축제 참가자',eventPhoto:'ywca-walking-festival',alt:'서울YWCA 시민걷기 축제 족압 측정 부스',summary:'남산 백범광장에서 참가자들을 대상으로 족압검사와 걷기 교육 등을 진행했습니다.',body:'서울YWCA 시민걷기 축제에서 참가자에게 족압검사와 상담을 제공했습니다. 현장에서 걷기 교육과 테이핑 봉사도 함께 진행했습니다.',items:['족압검사 및 상담','걷기 교육','테이핑 봉사'],source:'협회 소개자료 23~25쪽',program:'experience'},
  {
    slug:'samsung', category:'기업 · 임직원', program:'workplace',
    title:'족압 측정을 활용한 바른자세 걷기', institution:'삼성전자 근골격계질환예방운동센터',
    date:'', period:'자료에 일정 미기재', audience:'삼성전자 근골격계질환예방운동센터 이용 임직원',
    eventPhoto:'samsung-measurement-room', alt:'삼성전자 센터의 족압 측정 장비', photoNote:'삼성전자 센터의 족압 측정 공간',
    summary:'임직원의 근골격계질환 예방운동에 족압 측정과 바른자세 걷기 교육을 연결한 사례입니다.',
    body:'협회 소개자료에는 수원, 온양, 평택, 화성, 종합기술원 등 삼성전자 사업장의 근골격계질환예방운동센터 활동이 소개돼 있습니다.',
    items:['족압 측정','근골격계질환 예방을 위한 바른자세 걷기 교육'], source:'협회 소개자료 60쪽',
  },
  {
    slug:'hyundai', category:'기업 · 임직원', program:'workplace',
    title:'근골격계질환 예방보건 캠페인', institution:'현대백화점 · 양천구청',
    date:'2026.03', period:'2026년 3월', audience:'현대백화점 직원',
    eventPhoto:'hyundai-workplace', alt:'현대백화점 직원들이 캠페인 강의를 듣는 모습',
    summary:'현대백화점에서 직원들을 대상으로 근골격계질환 예방보건 캠페인을 진행했습니다.',
    body:'현대백화점과 양천구청이 주관한 캠페인에서 임직원이 근골격계 건강을 주제로 한 교육에 참여했습니다.',
    items:['직원 대상 근골격계질환 예방 교육','현장 상담'], source:'협회 소개자료 44~45쪽',
  },
  {
    slug:'yangju', category:'보건소 · 복지관', program:'community',
    title:'관절염 예방을 위한 올바른 걷기 교육', institution:'양주시보건소',
    date:'2026.04–07', period:'2026년 4~7월, 2회', audience:'양주시 중년 여성',
    eventPhoto:'yangju-measurement', alt:'양주시 교육 현장에서 참가자가 족압 측정 장비에 올라선 모습',
    summary:'양주시 서부건강생활지원센터에서 중년 여성을 대상으로 올바른 걷기 교육을 진행했습니다.',
    body:'양주시청이 주관한 교육에서 관절 건강을 주제로 걷기 방법을 안내하고 족압 측정을 진행했습니다.',
    items:['올바른 걷기 교육','족압 측정'], source:'협회 소개자료 46~47쪽',
  },
  {
    slug:'pangyo', category:'보건소 · 복지관', program:'community',
    title:'노인의 달 맞이 가을문화축제', institution:'판교노인종합복지관',
    date:'2026.10', period:'2026년 10월 21~22일', audience:'복지관 이용 어르신과 행사 참가자',
    eventPhoto:'pangyo-festival', alt:'판교노인종합복지관 가을문화축제 현장',
    summary:'판교노인종합복지관 가을문화축제에서 협회가 체험 부스를 운영했습니다.',
    body:'복지관의 노인의 달 행사에서 방문객이 협회의 걷기·족압 체험을 접할 수 있도록 현장 부스를 마련했습니다.',
    items:['가을문화축제 현장 부스','걷기·족압 체험 안내'], source:'협회 소개자료 55쪽',
  },
  {
    slug:'yangcheon', category:'보건소 · 복지관', program:'community',
    title:'바른자세 걷기 교육', institution:'양천구보건소',
    date:'2025–2026', period:'2025~2026년', audience:'양천구 지역주민',
    eventPhoto:'yangcheon-practice', alt:'양천구보건소 걷기 교육에서 의자 옆 동작을 연습하는 주민들',
    summary:'양천구보건소 신관, 목동보건지소, 신월보건지소에서 지역주민을 위한 걷기 교육을 진행했습니다.',
    body:'주민들과 바른 걷기 및 근력운동을 연습하고 족압 측정과 상담을 진행했습니다. 족저근막염 관리에 관한 운동과 테이핑 방법도 교육에서 다뤘습니다.',
    items:['바른 걷기와 근력운동','족압 측정 및 상담','발 관리 운동과 테이핑 교육'], source:'협회 소개자료 35~37쪽',
  },
  {
    slug:'yangcheon-marathon', category:'행사 · 건강 체험', program:'experience',
    title:'제14회 양천구 마라톤대회', institution:'양천구청',
    date:'2025.04', period:'2025년 4월 12일', audience:'마라톤대회 참가자',
    eventPhoto:'yangcheon-marathon', alt:'양천구 마라톤대회의 건강체험 부스와 참가자들',
    summary:'해마루 축구장에서 열린 양천구 마라톤대회에서 참가자들의 족압을 검사하고 상담했습니다.',
    body:'대회 현장의 건강체험 부스에서 마라톤 참가자가 족압을 측정하고 결과에 대한 안내를 받을 수 있도록 운영했습니다.',
    items:['참가자 족압검사','측정 결과 상담'], source:'협회 소개자료 21~22쪽',
  },
  {
    slug:'anseong-festival', category:'행사 · 건강 체험', program:'experience',
    title:'안성시 바우덕이 축제', institution:'안성시 · 대한물리치료사협회 경기도회',
    date:'2024.10', period:'2024년 10월', audience:'바우덕이 축제 참가자',
    eventPhoto:'anseong-booth', alt:'안성 바우덕이 축제에서 족압을 측정하는 체험 부스',
    summary:'안성시 바우덕이 축제 체험 부스에서 족압 측정과 올바른 걷기 교육을 진행했습니다.',
    body:'축제 참가자들이 체험 부스를 방문해 발바닥 압력을 측정하고 올바른 걷기 방법을 배웠습니다.',
    items:['현장 족압 측정','올바른 걷기 교육'], source:'협회 소개자료 34쪽',
  },
  {
    slug:'seocho-health', category:'행사 · 건강 체험', program:'experience',
    title:'찾아가는 건강체험관', institution:'서초구보건소',
    date:'', period:'협회 자료 기준 연 8회', audience:'서초구 지역주민',
    eventPhoto:'seocho-health-booth', alt:'서초구 찾아가는 건강체험관 야외 부스를 방문한 주민들',
    summary:'서초구 여러 지역을 찾아 주민에게 족압 측정과 걷기·근력운동 교육을 제공했습니다.',
    body:'야외 건강체험관을 방문한 주민들이 족압을 측정하고 결과를 상담했습니다. 바른 걷기와 근력운동 방법도 현장에서 안내했습니다.',
    items:['족압 측정과 상담','바른 걷기와 근력운동 교육'], source:'협회 소개자료 38~39쪽',
  },
  {
    slug:'baby-expo', category:'행사 · 건강 체험', program:'experience',
    title:'임신·출산·유아 교육전', institution:'대한바른자세걷기협회',
    date:'2026.08', period:'2026년 8월 6~9일', audience:'MOM & BABY EXPO 방문객',
    eventPhoto:'baby-expo-consultation', alt:'임신·출산·유아 교육전에서 방문객을 상담하는 협회 부스',
    summary:'임신·출산·유아 교육전에서 협회 체험 부스를 열고 방문객과 상담했습니다.',
    body:'MOM & BABY EXPO 전시장에 족압 측정 장비와 바른 걷기 안내 자료를 마련했습니다. 방문객은 현장에서 걷기와 족압에 대해 질문할 수 있었습니다.',
    items:['족압 측정 장비 체험 안내','바른 걷기 상담'], source:'협회 소개자료 54쪽',
  },
  {
    slug:'seongnam-senior', category:'행사 · 건강 체험', program:'experience',
    title:'낙상 예방과 노년기 올바른 보행', institution:'성남고령친화체험관',
    date:'', period:'자료에 일정 미기재', audience:'노년기 보행에 관심 있는 어르신',
    eventPhoto:'seongnam-center', alt:'성남고령친화체험관 외관', photoNote:'성남고령친화체험관 외관',
    summary:'족압 측정으로 평소 걷는 습관을 살펴보는 성남고령친화체험관의 낙상 예방 프로그램입니다.',
    body:'걷는 동안 발바닥 압력을 측정해 개인의 보행 습관을 살펴봅니다. 자료에는 측정 결과를 바탕으로 한 인솔 체험과 보행 운동도 소개돼 있습니다.',
    items:['족압 측정과 보행 습관 확인','인솔 체험과 보행 운동'], source:'협회 소개자료 57쪽',
  },
  {
    slug:'chuncheon-walking-festival', category:'행사 · 건강 체험', program:'experience',
    title:'건강한 춘천 걷기축제', institution:'춘천시보건소',
    date:'2026.09', period:'2026년 9월 12일', audience:'걷기축제 참가자',
    eventPhoto:'chuncheon-walking-booth', alt:'건강한 춘천 걷기축제에서 상담을 받는 참가자들',
    summary:'건강한 춘천 걷기축제에서 스마트 족압 측정과 바른 보행 체험을 운영했습니다.',
    body:'춘천시보건소가 주관한 축제의 체험 부스에서 참가자에게 스마트 족압 측정과 바른 걷기 방법을 안내했습니다.',
    items:['스마트 족압 측정','올바른 보행 안내'], source:'협회 소개자료 58쪽',
  },
  {
    slug:'chuncheon-childcare', category:'행사 · 건강 체험', program:'experience',
    title:'건강한 발걸음 리더의 웰니스 워킹 클래스', institution:'춘천시 육아종합지원센터',
    date:'2026.07', period:'2026년 7월', audience:'보육교사',
    eventPhoto:'chuncheon-workshop-left', alt:'춘천시 육아종합지원센터에서 보육교사들이 걷기 강의를 듣는 모습',
    summary:'춘천시와 육아종합지원센터가 보육교사를 위한 바른 걷기 교육을 열었습니다.',
    body:'보육교사들이 웰니스 워킹 클래스에서 바른 걷기의 기본과 일상에서 적용할 걷기 방법을 배웠습니다.',
    items:['보육교사 대상 걷기 강의','바른 걷기 방법 안내'], source:'협회 소개자료 52쪽',
  },
  {
    slug:'sillegil-walk', category:'행사 · 건강 체험', program:'experience',
    title:'김유정 실레이야기길 걷기', institution:'춘천시번영회',
    date:'2026.10', period:'2026년 10월 24일', audience:'실레이야기길 걷기 참가자',
    eventPhoto:'sillegil-booth', alt:'김유정 실레이야기길 걷기 행사에 마련된 협회 체험 부스',
    summary:'김유정 실레이야기길 걷기 행사에서 참가자를 위한 협회 체험 부스를 운영했습니다.',
    body:'춘천시번영회가 주관한 걷기 행사에서 참가자들이 협회 부스를 방문해 스마트 족압 측정과 바른 보행 안내를 접했습니다.',
    items:['현장 체험 부스','스마트 족압 측정과 바른 보행 안내'], source:'협회 소개자료 61쪽',
  },
  {
    slug:'gyeonggi-education', category:'학교 · 청소년', program:'school',
    title:'Walk Together 걷기 연수교육', institution:'경기도교육청',
    date:'2026.06', period:'2026년 6월', audience:'걷기 연수교육 참가자',
    image:'lecture', alt:'협회의 다른 바른 걷기 교육 참고 사진', photoNote:'협회의 다른 걷기 교육 현장 참고 사진',
    summary:'경기도교육청 중앙도서관에서 Walk Together 걷기 연수교육을 진행했습니다.',
    body:'경기도교육청이 주관한 걷기 연수교육입니다. 협회 소개자료에는 교육명과 장소가 기록돼 있습니다.',
    items:['Walk Together 걷기 연수교육'], source:'협회 소개자료 59쪽',
  },
  {
    slug:'seocho-ai-walking', category:'보건소 · 복지관', program:'community',
    title:'똑똑하게 걷자! AI 걷기 운동교실', institution:'서초구청',
    date:'2026.04 · 09', period:'2026년 4월과 9월', audience:'서초구 지역주민',
    eventPhoto:'seocho-class', alt:'서초구청 AI 걷기 운동교실에서 교육과 상담을 받는 주민들',
    summary:'서초구청에서 지역주민을 대상으로 AI 걷기 운동교실을 열었습니다.',
    body:'서초구청이 주관한 운동교실에서 주민에게 걷기 운동을 안내했습니다. 교육실에서 참가자를 대상으로 현장 상담도 진행했습니다.',
    items:['주민 대상 걷기 운동 교육','현장 상담'], source:'협회 소개자료 40~41쪽',
  },
  {
    slug:'gunpo-fall-prevention', category:'보건소 · 복지관', program:'community',
    title:'경로당 건강지도자 낙상예방교육', institution:'군포시 산본보건지소',
    date:'2026년 상반기', period:'2026년 상반기', audience:'경로당 건강지도자',
    eventPhoto:'gunpo-leader-training', poster:true, alt:'군포시 산본보건지소 상반기 경로당 건강지도자교육 현수막',
    summary:'경로당 건강지도자를 대상으로 어르신 낙상 예방을 위한 근력·균형운동을 교육했습니다.',
    body:'군포시보건소가 주관한 산본보건지소 교육에서 경로당 건강지도자에게 어르신의 근력과 균형을 기르는 운동을 안내했습니다. 소개자료에는 근력·균형 운동 완성프로그램 ‘어운완’으로 소개돼 있습니다.',
    items:['경로당 건강지도자 낙상예방교육','어르신 근력·균형운동 지도'], source:'협회 소개자료 43쪽',
  },
  {
    slug:'jeonnam-instructor-training', category:'전문인력 교육', program:'instructor',
    title:'바른자세걷기 강사양성과정', institution:'대한물리치료사협회 전남지부',
    date:'2026.07', period:'2026년 7월 25일', audience:'전남지부 물리치료사',
    eventPhoto:'instructor-workshop', alt:'대한물리치료사협회 전남지부 강사양성과정 참가자들이 강의를 듣는 모습',
    summary:'대한물리치료사협회 전남지부가 주관한 강사양성과정에서 최영호 강사가 스마트 족압 분석과 올바른 보행을 교육했습니다.',
    body:'목포시 상설보수교육센터에서 열린 과정입니다. 최영호 강사는 족압 측정 화면을 활용해 발바닥에 실리는 압력과 보행 특성을 설명하고, 발에 맞는 신발을 고르는 기준을 안내했습니다.',
    items:['스마트 족압·보행 분석','올바른 보행 지도','발에 맞는 신발 선택'], source:'협회 소개자료 53쪽 및 강사양성과정 안내 포스터',
  },
];
export const articles = [
  {slug:'plantar-pressure',category:'족압 이해',title:'족압 측정은 무엇을 살펴보나요?',lead:'족압은 발바닥에 실리는 압력을 뜻합니다. 협회 교육에서는 측정 결과를 바탕으로 자신의 발과 보행 습관을 이해하는 시간을 갖습니다.',image:'walking-test',sections:[['내 걸음을 이해하는 자료','발바닥에 압력이 어떻게 분포하는지 살펴보며 자신의 보행 특성을 이해하는 교육에 활용합니다. 측정 장비와 과정에 따라 제공되는 내용은 달라집니다.'],['측정과 교육은 어떻게 이어지나요?','협회는 족압·보행 측정과 올바른 걷기, 신발 선택, 운동 교육을 프로그램에 맞게 구성합니다. 모든 과정에 같은 측정이 포함되는 것은 아니므로 기관 협의 시 확인합니다.'],['결과를 볼 때 알아둘 점','한 번의 측정 결과만으로 질환이나 원인을 단정하지 않습니다. 이 페이지는 협회의 교육 방식을 안내하며 개인에 대한 진단이나 치료 지침을 제공하지 않습니다.']],source:'협회 소개자료 2·26~28쪽, 「족압분석을 통한 인솔제작과 올바른 보행」 강의자료 1~2쪽'},
  {slug:'walking-exercise',category:'교육 안내',title:'걷기 교육에서 근력·균형운동도 배우나요?',lead:'협회는 걷기 방법과 함께 근력·균형·유연성 운동을 교육합니다. 프로그램의 대상과 장소에 따라 이론과 운동 실습을 조합합니다.',image:'outdoor',sections:[['걸음과 운동을 함께 배우는 구성','협회 소개자료에는 걷기에 필요한 근력운동, 균형운동, 유연성운동 교육이 주요 활동으로 안내되어 있습니다. 실제 교육에서는 참여자와 현장에 맞춰 내용을 협의합니다.'],['실제 교육 사례','서호노인복지관의 2025년 프로그램은 사전검사, 유연성·균형·근력운동을 포함한 걷기 프로그램, 사후검사로 구성했습니다.'],['기관 교육을 준비한다면','대상자의 연령대, 인원, 교육 장소, 희망 회차를 먼저 정리하면 과정 구성에 도움이 됩니다. 장비 측정과 결과 안내 제공 범위도 함께 협의합니다.']],source:'협회 소개자료 2·26~32쪽'},
  {slug:'prepare-class',category:'기관 담당자 안내',title:'기관 걷기 교육은 어떻게 준비하나요?',lead:'교육 대상, 지역과 장소, 예상 인원, 희망 시기를 알려주시면 프로그램 구성을 협의할 수 있습니다. 일정이 확정되지 않았어도 문의할 수 있습니다.',image:'lecture',sections:[['먼저 정리하면 좋은 정보','교육 목적과 참여자의 특성, 예상 인원, 실내·야외 공간, 희망 회차를 정리해 주세요. 보건소·복지관·학교·기업 등 기관의 환경에 맞춰 상담합니다.'],['측정과 실습 범위 협의','족압·보행 측정이 필요한지, 걷기 및 운동 실습을 어디에서 진행할지 확인합니다. 장비 운영과 참여 규모에 따라 진행 방식이 달라질 수 있습니다.'],['문의 후 안내','문의 내용에 따라 교육 구성, 일정, 비용 등을 협의합니다. 홈페이지의 기관 교육 문의 양식이나 대표 전화·이메일로 연락하실 수 있습니다.']],source:'협회 소개자료의 기관별 교육 사례를 바탕으로 작성한 문의 안내'}
];
export const faqs = [
 ['대한바른자세걷기협회는 어떤 단체인가요?','물리치료사의 전문성을 바탕으로 족압·보행 측정과 바른 걷기, 근력·균형·유연성 운동 교육을 제공하는 협회입니다. 협회 소개자료에 따르면 2023년 2월 발족했습니다.'],
 ['어떤 기관이 교육을 문의할 수 있나요?','보건소·지자체·복지관·학교·기업과 행사 운영기관 등에서 교육을 문의할 수 있습니다. 대상과 운영 환경에 맞춰 교육 구성을 협의합니다.'],
 ['모든 교육에 족압 측정이 포함되나요?','프로그램마다 다릅니다. 족압·보행 측정 여부와 장비 운영, 실습 범위는 대상·인원·장소에 따라 사전에 협의합니다.'],
 ['교육 시간과 비용은 어떻게 정하나요?','대상, 예상 인원, 지역, 회차와 측정 구성에 따라 협의합니다. 문의 양식에 희망 내용을 남기거나 전화·이메일로 연락해 주세요.'],
 ['개인이 바로 교육을 신청할 수 있나요?','기관 주관 교육은 해당 기관의 모집 안내와 접수처를 확인해 주세요. 협회 홈페이지의 문의 양식은 기관 교육과 협력 상담을 위한 창구입니다.']
];
export const eventPhotoGroups = [
  {
    id: 'public-health', title: '보건소·복지관 교육',
    events: [
      {title:'권선구보건소 어르신 건강걷기', photos:[
        ['gwonseon-bridge','다리 위 보행로에서 걷기 실습'],
        ['gwonseon-path','숲길을 따라 걷는 참가자들'],
      ]},
      {title:'양천구보건소 바른자세 걷기 교육', photos:[
        ['yangcheon-practice','의자 옆에서 동작을 따라 하는 참가자들'],
        ['yangcheon-instruction','강사가 화면을 보며 운동 방법을 설명하는 모습'],
        ['yangcheon-class','교육실에서 함께하는 걷기 운동'],
      ]},
      {title:'장안구보건소 도심 속 공원 건강 걷기', photos:[
        ['jangan-park','공원에서 걷기와 운동을 배우는 주민들'],
      ]},
      {title:'서호노인복지관 걸어보자! 건강하게!', photos:[
        ['seoho-balance','운동장에서 한 발 서기 동작을 연습하는 참가자들'],
        ['seoho-outdoor','나무 그늘에서 함께하는 야외 운동'],
        ['seoho-assessment','실내에서 진행한 프로그램 사전검사'],
      ]},
      {title:'송파구보건소 바르게 걷기 강좌', photos:[
        ['songpa-attendees','강의실에서 바르게 걷기 강좌를 듣는 주민들'],
        ['songpa-demonstration','강사가 교육실 앞에서 동작을 시범 보이는 모습'],
      ]},
      {title:'서초구청 AI 걷기 운동교실', photos:[
        ['seocho-class','강의와 상담이 진행된 교육실'],
        ['seocho-consultation','교육 현장에서 참가자와 상담하는 모습'],
      ]},
    ],
  },
  {
    id: 'community-events', title: '걷기 행사·건강 체험',
    events: [
      {title:'김유정 실레이야기길 걷기', photos:[
        ['sillegil-booth','걷기 행사에 마련된 협회 체험 부스'],
      ]},
      {title:'건강한 춘천 걷기축제', photos:[
        ['chuncheon-walking-booth','걷기축제에서 운영한 바른자세 걷기 체험 부스'],
      ]},
      {title:'판교노인종합복지관 가을문화축제', photos:[
        ['pangyo-festival','참가자들이 모인 가을문화축제 현장'],
      ]},
      {title:'임신출산·유아 교육전', photos:[
        ['baby-expo-consultation','전시장 협회 부스에서 진행한 상담'],
      ]},
      {title:'서초구보건소 찾아가는 건강체험관', photos:[
        ['seocho-health-measurement','야외 체험 부스에서 장비로 측정하는 모습'],
        ['seocho-health-booth','주민이 방문한 야외 건강체험관'],
      ]},
      {title:'서울YWCA 시민걷기 축제', photos:[
        ['ywca-walking-festival','축제 참가자가 찾은 족압 측정 부스'],
      ]},
      {title:'양천구 마라톤 대회', photos:[
        ['yangcheon-marathon','대회 참가자가 이용한 양천구보건소 건강체험 부스'],
      ]},
      {title:'안성 바우덕이 축제', photos:[
        ['anseong-booth','축제 현장에서 진행한 족압 측정과 걷기 교육'],
      ]},
      {title:'서울YWCA 생명살림 바자회', photos:[
        ['ywca-bazaar-floor','바자회에 마련된 족압분석 체험 공간'],
        ['ywca-bazaar-measurement','부스에서 측정 결과를 살펴보는 모습'],
      ]},
    ],
  },
  {
    id: 'workshops', title: '기관·강사 교육',
    events: [
      {title:'대한물리치료사협회 전남지부 강사양성과정', photos:[
        ['instructor-demo','바른자세걷기 동작을 시범 보이는 강사'],
        ['instructor-workshop','강사양성과정 수강생들이 강의를 듣는 모습'],
      ]},
      {title:'춘천시 육아종합지원센터 워킹 클래스', photos:[
        ['chuncheon-workshop-left','보육교사 대상 바른 걷기 교육 현장'],
        ['chuncheon-workshop-right','강사가 강의실 앞에서 걷기 방법을 설명하는 모습'],
      ]},
      {title:'현대백화점 근골격계질환 예방보건 캠페인', photos:[
        ['hyundai-workplace','현대백화점 임직원 대상 교육 현장'],
      ]},
      {title:'경찰병원 올바른 걷기 교육', photos:[
        ['police-hospital-practice','강당에서 일어나 동작을 따라 하는 참가자들'],
        ['police-hospital-class','강당에서 진행한 바른 걷기 강의'],
      ]},
    ],
  },
];
