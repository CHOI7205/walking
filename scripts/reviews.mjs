// Transcribed anonymously from the two participant-feedback documents supplied by the association.
// Do not copy names or source-document photos into public assets.
const feedback = [
  '평소 걷기운동을 더욱 신경써서 할 수 있게 돼 감사함을 느낍니다.',
  '정기 프로그램에 넣어주세요. 걷는 방법을 알게 되어 감사합니다.',
  '왜 진작 이런 걷기교육을 못 받았을까 하는 아쉬움이 있을 정도로 매우매우 유익한 교육이었다. 너무 감사합니다.',
  '너무 감사하고 고맙습니다.',
  '짧은 시간 걷기에 올바른 강의 감사합니다. 앞으로 두 가지 꼭 실천하려고 합니다. ‘보폭은 넓게, 신발 끈은 꽉 묶기’. 다음 프로그램으로 슬로우 조깅 추천합니다.',
  '올바른 걷기에 관한 강의로 평소의 걷기 습관의 문제점을 개선하여 건강해져야겠다고 다짐하는 좋은 강의시간이었습니다. 감사합니다.',
  '매우 유익한 시간이었습니다. 처음 들어본 강의로 이런 기회를 주셔서 감사합니다. 열심히 노력해서 나의 발 건강, 몸 건강으로 보답하겠습니다. 모든 관계자분과 선생님께 감사드립니다.',
  '걷기가 중요함을 알고 있었지만 구체적으로 내 발의 생김새를 알아보고, 자세를 바르게 하려고 신경쓰고, 걸어보게 되었습니다. 감사합니다.',
  '사소한 습관이 큰 영향을 주는 것을 느꼈습니다. 앞으로 조금씩 좋아질 것 같고, 수업 중 야외로 나가 걷는 시간이 있었으면 더 좋았을 것 같아요.',
  '발 건강 교육 평생 처음 받아봤는데 정말 좋았습니다. 다음 기회가 된다면 더욱더 좋겠습니다.',
  '발의 모양을 보고 내 스스로가 너무 무지함을 느꼈다. 발은 그냥 걷기만 하면 되는 줄 알았는데 그렇게 깊은 의미와 중요성을 이번 강의를 통하여 절감하였다. 내가 지금까지 걷기는 나의 건강을 해칠 수 있음을 깨닫고 배우고 싶은 마음이 더욱 깊어진다. 앞으로도 이런 내용의 강의가 종종 있었으면 더욱 감사하겠습니다.'
];
const esc = text => text.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

export function renderReviews() {
  return `<section class="section"><div class="container reviews-container">
    <div class="reviews-intro"><span class="pill">참여자 익명 후기</span><h2>걷기를 배우고 남겨주신 이야기</h2><p>대한바른자세걷기협회가 전달받은 걷기교육 후기와 프로그램 만족도 조사에서 참여자의 목소리를 소개합니다.</p><p class="source-note">개인정보 보호를 위해 이름을 제외하고 텍스트로 옮겼습니다. 읽기 쉽도록 띄어쓰기와 줄바꿈을 정리했습니다. 이름이 포함된 원본 사진은 공개하지 않습니다.</p></div>
    <section aria-labelledby="walking-reviews-title"><div class="section-head"><div><p class="eyebrow">Walking education</p><h2 id="walking-reviews-title">걷기교육 참여 소감</h2></div><a class="text-link" href="/stories/">교육·활동 사례 보기 <span aria-hidden="true">↗</span></a></div>
    <div class="reviews-grid">${feedback.map((text,i)=>`<figure class="review-card"><figcaption><span class="review-number">${String(i+1).padStart(2,'0')}</span>걷기교육 참여자 · 익명</figcaption><blockquote><p>${esc(text)}</p></blockquote></figure>`).join('')}</div></section>
    <section class="review-survey" aria-labelledby="survey-title"><p class="eyebrow">Program feedback</p><h2 id="survey-title">프로그램 만족도 조사에서 전해주신 소감</h2><p>첨부해 주신 보건소 프로그램 만족도 조사 1부에서 확인한 응답입니다.</p><dl class="review-responses"><div><dt>참여 후 소감</dt><dd>“운동에 진심”</dd></div><div><dt>강사의 전문성</dt><dd>“넘 좋아요.”</dd></div><div><dt>강사의 성실성</dt><dd>“좋아요”</dd></div><div><dt>시설·환경 만족도</dt><dd>“좋아요”</dd></div></dl></section>
    <p class="review-note">이 후기는 참여자가 작성한 개인적인 소감으로, 전체 참여자의 평가나 의학적 효과를 뜻하지 않습니다. 후기 속 걷기 방법은 개인의 경험이며, 교육에서는 참여자의 몸 상태와 환경에 맞춰 안내합니다.</p>
  </div></section>`;
}
