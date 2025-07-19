import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate 추가
import "../css/PostPage.css";

const PostDetailPage = () => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { id: 1, author: "user456", text: "이 게시글 정말 좋아요!" },
    { id: 2, author: "admin", text: "관리자가 남긴 댓글" },
  ]);

  const currentUserId = "user123"; // 현재 로그인한 사용자 ID
  const currentUserRole = "user"; // 또는 "admin"

  const navigate = useNavigate(); // 페이지 이동용 훅

  const handleAddComment = () => {
    if (!comment.trim()) {
      alert("댓글을 입력해주세요.");
      return;
    }

    const newComment = {
      id: Date.now(),
      author: currentUserId,
      text: comment,
    };

    setComments([newComment, ...comments]);
    setComment("");
  };

  const handleDeleteComment = (id, author) => {
    const isAuthorized =
      currentUserId === author || currentUserRole === "admin";

    if (!isAuthorized) {
      alert("❌ 삭제할 권한이 없습니다.");
      return;
    }

    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;

    const updatedComments = comments.filter((c) => c.id !== id);
    setComments(updatedComments);

    alert("✅ 삭제되었습니다.");
    navigate("/postdetailpage"); // 삭제 후 이동
  };

  return (
    <div className="container">
      <h2>게시글 상세</h2>

      <div className="post-box">
        <h3>게시글 제목</h3>
        <p>게시글 내용이 여기에 표시됩니다.</p>
        <p>작성자: user123</p>

        <Link to="/editpostpage">
          <button>수정</button>
        </Link>
        <Link to="/deletepostpage">
          <button>삭제</button>
        </Link>
      </div>

      <hr />

      <div className="comment-write">
        <h4>댓글 작성</h4>
        <textarea
          placeholder="댓글을 입력하세요"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={handleAddComment}>댓글 작성</button>
      </div>

      <div className="comment-list">
        <h4>댓글 목록</h4>
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <p>
              {c.author}: {c.text}
            </p>
            <Link to="/editcommentpage">
              <button>수정</button>
            </Link>
            <button onClick={() => handleDeleteComment(c.id, c.author)}>
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostDetailPage;
