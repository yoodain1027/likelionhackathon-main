import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/PostPage.css";

const EditCommentPage = () => {
  const type = "comment"; // 댓글 수정용
  const currentUserId = "user123"; // 로그인 사용자 ID (임시)
  const currentUserRole = "user"; // 또는 "admin"
  const commentAuthorId = "user123"; // 댓글 작성자 ID (임시)

  const [content, setContent] = useState("기존 댓글 내용");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  const handleEdit = () => {
    if (currentUserId === commentAuthorId || currentUserRole === "admin") {
      // 수정 성공
      setIsSuccess(true);
      setIsError(false);
      // 실제 DB 연동하는 코드가 있다면 여기에 작성

      // 1초 후 페이지 이동
      setTimeout(() => {
        navigate("/postdetailpage");
      }, 1000);
    } else {
      // 권한 없음
      setIsSuccess(false);
      setIsError(true);
    }
  };

  return (
    <div className="container">
      <h2>{type === "post" ? "게시글 수정" : "댓글 수정"}</h2>

      {type === "post" && (
        <input type="text" placeholder="제목 (게시글 수정 시)" />
      )}

      <textarea value={content} onChange={(e) => setContent(e.target.value)} />

      <button onClick={handleEdit}>수정 완료</button>

      {/* 메시지 */}
      {isSuccess && <div className="message success">✅ 완료되었습니다</div>}
      {isError && (
        <div className="message error">❌ 수정할 권한이 없습니다</div>
      )}

      {/* 실패 시만 돌아가기 버튼 표시 */}
      {isError && (
        <Link to="/postdetailpage">
          <button>돌아가기</button>
        </Link>
      )}
    </div>
  );
};

export default EditCommentPage;
