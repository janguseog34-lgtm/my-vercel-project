# 모락한끼 문제 해결 과정 문서

## 1. GitHub에 코드가 올라가지 않음

### 막혔던 지점

처음 GitHub에 push할 때 `orgin` 오타가 있었고, 이후 HTTPS push 과정에서 GitHub 비밀번호 인증을 시도해 실패했다.

```text
fatal: 'orgin' does not appear to be a git repository
remote: Invalid username or token. Password authentication is not supported for Git operations.
```

### 원인

Git remote 이름은 `origin`이어야 하는데 `orgin`으로 입력했다. 또한 GitHub는 일반 비밀번호로 Git push를 허용하지 않고, Personal Access Token 또는 GitHub CLI 인증을 사용해야 한다.

### 해결 방법

1. remote 이름을 `origin`으로 정확히 사용했다.
2. GitHub Personal Access Token으로 인증했다.
3. 이후 `git push -u origin main`으로 정상 push했다.

### 결과

로컬 프로젝트가 GitHub 저장소와 연결되었고, Vercel 배포를 위한 기반이 만들어졌다.

## 2. 공개 URL이 자꾸 바뀌거나 접속되지 않음

### 막혔던 지점

`localhost:3000`은 내 컴퓨터에서만 접속 가능했고, 임시 공개 URL은 시간이 지나거나 터널이 끊기면 `No tunnel` 또는 `503`이 발생했다.

### 원인

`localhost.run` 같은 터널 URL은 임시 연결이다. 로컬 서버와 터널 프로세스가 계속 살아 있어야 외부 접속이 가능하며, 고정 배포 URL이 아니다.

### 해결 방법

1. 로컬 개발은 Docker 기반으로 `make up`, `make down`을 사용하도록 정리했다.
2. 임시 공유가 필요할 때는 터널을 새로 열어 공개 URL을 만들었다.
3. 최종 목표는 Vercel 배포로 정리했다. Vercel에 배포하면 임시 터널이 아니라 고정 공개 URL을 사용할 수 있다.

### 결과

임시 URL과 진짜 배포 URL의 차이를 구분했다. 개발 중 확인은 `localhost`, 외부 공유 테스트는 터널, 최종 제출/공개는 Vercel 배포로 방향을 정했다.

## 3. 장바구니 담기 후 화면 스크롤이 흔들림

### 막혔던 지점

메뉴의 `담기` 버튼을 누르면 화면이 맨 위로 올라가거나, 주문 영역으로 이동하거나, 현재 위치가 과하게 고정되어 스크롤 조작이 불편해지는 문제가 있었다.

### 원인

처음에는 서버 액션 후 redirect가 발생하면서 브라우저 스크롤 위치가 초기화되었다. 이후 이를 막기 위해 스크롤 복원 로직을 강하게 넣었는데, 이 방식은 일정 시간 동안 화면 위치를 계속 되돌려서 사용자가 자연스럽게 스크롤하기 어렵게 만들었다.

### 해결 방법

1. 장바구니 액션을 클라이언트 폼 컴포넌트에서 처리하도록 `CartActionForm`을 만들었다.
2. 서버 액션은 redirect 대신 inline action으로 실행하고, 성공 후 `router.refresh()`로 데이터만 갱신했다.
3. 오래 유지되던 전역 스크롤 복원 컴포넌트를 제거했다.
4. 버튼 클릭 직후 짧은 시간만 현재 위치를 보정하도록 단순화했다.

### 결과

`담기`, `+`, `-`, `취소`를 눌러도 사용자가 보던 위치가 크게 흔들리지 않고, 이후에는 정상적으로 스크롤할 수 있게 되었다.

## 정리

| 문제 | 핵심 원인 | 해결 |
| --- | --- | --- |
| GitHub push 실패 | remote 오타와 비밀번호 인증 방식 | `origin` 사용, GitHub 토큰 인증 |
| 공개 URL 불안정 | 임시 터널은 고정 배포가 아님 | 로컬/터널/Vercel 역할 분리 |
| 장바구니 스크롤 문제 | redirect와 과한 스크롤 복원 | inline action, 짧은 위치 보정, 전역 복원 제거 |
