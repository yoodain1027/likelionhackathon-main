import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/PostPage.css";

const EditPostPage = () => {
  const type = "post"; // 게시글 수정용
  const currentUserId = "user123"; // 로그인 사용자 ID (임시)
  const currentUserRole = "user"; // 또는 "admin"
  const postAuthorId = "user123"; // 게시글 작성자 ID (임시)

  const [title, setTitle] = useState("기존 게시글 제목");
  const [content, setContent] = useState("기존 게시글 내용");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  const handleEdit = () => {
    if (currentUserId === postAuthorId || currentUserRole === "admin") {
      setIsSuccess(true);
      setIsError(false);
      // 실제 DB 연동 코드 위치

      // 1초 뒤에 postdetailpage로 이동
      setTimeout(() => {
        navigate("/postdetailpage");
      }, 1000);
    } else {
      setIsSuccess(false);
      setIsError(true);
    }
  };

  return (
    <div className="container">
      <h2>{type === "post" ? "게시글 수정" : "댓글 수정"}</h2>

      {type === "post" && (
        <input
          type="text"
          value={title}
          placeholder="제목"
          onChange={(e) => setTitle(e.target.value)}
        />
      )}

      <textarea
        value={content}
        placeholder="내용"
        onChange={(e) => setContent(e.target.value)}
      />

      <button onClick={handleEdit}>수정 완료</button>

      {/* 메시지 */}
      {isSuccess && (
        <div className="message success">✅ 게시글이 수정되었습니다</div>
      )}
      {isError && (
        <div className="message error">❌ 수정할 권한이 없습니다</div>
      )}

      {/* 돌아가기 버튼은 실패했을 때만 보이게 설정 (선택 사항) */}
      {isError && (
        <Link to="/postdetailpage">
          <button>돌아가기</button>
        </Link>
      )}
    </div>
  );
};

export default EditPostPage;
