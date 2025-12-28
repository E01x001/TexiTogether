프로젝트 이름을 Taxi Together로 변경하여, 지금까지의 논의 내용과 MCP 서버 환경을 반영한 최종 **PRD(제품 요구사항 정의서)**를 작성했습니다.

📄 Product Requirements Document: Taxi Together
프로젝트 명: Taxi Together (TT)

버전: 1.0

상태: 초안 (Draft)

작성일: 2025년 12월 29일

1. 제품 개요 (Product Overview)
목적: 평택역과 캠프 험프리스(워킹게이트, CPX 등) 구간을 오가는 부대 구성원들이 택시를 함께 타고 요금을 나누는 동승 매칭 플랫폼.

핵심 가치: 1인당 이동 비용의 획기적 절감(최대 75%), 안전한 신분 기반 커뮤니티, 정산 스트레스 해소.

차별점: 직접 결제 시스템 없이 딥링크(Toss, PayPal)를 활용한 '정산 보조' 모델로 법적 리스크 최소화 및 개발 속도 확보.

2. 타겟 사용자 (Target Audience)
미군 (US Army): 한국 택시 앱 사용 및 한국어 소통이 어려운 인원. 달러(PayPal/Venmo) 정산 선호.

카투사 (KATUSA): 한국 금융 앱 사용에 능숙하며 주로 방장(Host) 역할을 수행하여 택시 호출을 담당.

군무원 및 민간인 (Civilian/Contractors): 부대 정기 출입자이나 군 이메일이 없는 경우를 포함.

3. 기능적 요구사항 (Functional Requirements)
3.1 신뢰 기반 인증 시스템 (Multi-layer Verification)
휴대폰 인증: SMS OTP를 통한 본인 확인 (노쇼 방지용).

신분 정보 입력: 이름, 소속(Mil/KATUSA/Civil), DOD ID(선택) 직접 입력.

출입증 인증: CAC 또는 DBIDS 카드 사진 업로드 후 관리자 수동 승인.

인증 배지: 단계별 인증 완료 시 프로필 옆에 Verified 마크 표시.

3.2 실시간 매칭 (Party Matching)
방 생성: 출발/목적지(평택역 ↔ 게이트), 출발 시간, 모집 인원(최대 4인) 설정.

방 목록: 현재 활성화된 방을 실시간으로 확인하고 필터링(결제 수단별).

참여/탈퇴: 실시간으로 방에 참여하고 정원이 차면 자동으로 모집 마감.

3.3 정산 보조 계산기 (Settlement Helper)
1/N 자동 계산: 방장이 최종 미터기 요금을 입력하면 인원수대로 자동 분할.

송금 딥링크: * 한국 유저: 토스, 카카오페이 앱 자동 호출.

미국 유저: PayPal.Me 또는 Venmo 링크 생성 및 연결.

3.4 실시간 채팅 (Real-time Chat)
커뮤니케이션: 매칭된 인원 간 픽업 위치 조율을 위한 실시간 메시징.

번역 기능 (Phase 2): 한/영 언어 장벽 해소를 위한 간단한 번역 레이어 추가.

4. 데이터베이스 및 기술 요구사항 (Technical Requirements)
4.1 데이터베이스 설계 (Supabase)
profiles: 사용자 인증 정보 및 평판 점수 관리.

rooms: 동승 매칭 정보 및 상태 관리.

room_members: 방과 사용자의 N:M 관계 매칭.

4.2 시스템 아키텍처
플랫폼: Expo (React Native)를 통한 iOS/Android 동시 지원.

지도: Google Maps API를 통한 경로 및 게이트 위치 최적화.

5. 로드맵 (Roadmap)
Phase 1 (Infrastructure): Supabase DB 연동 및 사용자 프로필/인증 테이블 구축.

Phase 2 (MVP UI): 회원가입(인증 포함) 및 메인 방 목록 화면 개발.

Phase 3 (Core Logic): 방 만들기 및 1/N 정산 링크 생성 기능 구현.

Phase 4 (Testing): 부대 내 테스트 그룹 운영 및 버그 수정.

6. 성공 지표 (Success Metrics)
매칭 완료율: 생성된 방 중 실제 주행까지 이어진 비율 70% 이상.

평균 절감 비용: 사용자 1인당 회당 최소 10,000원 이상의 비용 절감 효과 체감.