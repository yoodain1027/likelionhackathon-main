import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/PostPage.css";
import axios from 'axios';

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

   const handleEdit = async () => {
    if (currentUserId === postAuthorId || currentUserRole === 'admin') {
      try {
        // 📨 수정 요청 보내기
        const response = await axios.put(
          `https://joongbu.store/api/posts/${id}`,
          { title, content },
          { withCredentials: true }
        );

        console.log('응답:', response.data);

        //  수정 성공 처리 후 페이지 이동
        setTimeout(() => {
          console.log("1초 뒤 페이지 이동"); // 디버깅용
          navigate(`/postdetailpage/${id}`); // or 그냥 "/postdetailpage" 원하시는 페이지로
        }, 1000);
      } catch (err) {
        console.error('수정 실패:', err.response?.data || err.message);
      }
    } else {
      console.warn('권한 없음: 작성자 또는 관리자만 수정 가능');
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
