"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import MuiButton from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Rating from "@mui/material/Rating";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Paper from "@mui/material/Paper";
import LinearProgress from "@mui/material/LinearProgress";
import {
  ArrowLeft,
  Award,
  Calendar,
  Edit,
  MessageSquare,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addReview,
  updateReview,
  deleteReview,
  selectAllReviews,
  loadReviews,
} from "@/store/slices/reviewSlice";
import { Dentist, fetchDentist } from "@/data/dentists";
import { toast } from "sonner";

export default function DentistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dentistId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const isAdmin = session?.user?.role === "admin";
  const dispatch = useAppDispatch();

  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [loading, setLoading] = useState(true);

  const allReviews = useAppSelector(selectAllReviews);
  const dentistReviews = allReviews.filter(
    (r: any) => r.dentistId === dentistId,
  );
  const userReview = user
    ? dentistReviews.find((r: any) => r.userId === user.id)
    : undefined;
  const avgRating =
    dentistReviews.length > 0
      ? dentistReviews.reduce((s: number, r: any) => s + r.rating, 0) /
        dentistReviews.length
      : 0;
  const canReview = isAuthenticated && !isAdmin && !userReview;

  // Fetch dentist data
  useEffect(() => {
    const loadDentist = async () => {
      try {
        const data = await fetchDentist(dentistId);
        setDentist(data);
      } catch (error) {
        console.error('Failed to load dentist:', error);
        toast.error('Failed to load dentist information');
      } finally {
        setLoading(false);
      }
    };

    if (dentistId) {
      loadDentist();
    }
  }, [dentistId]);

  useEffect(() => {
  if (dentistId && session?.accessToken) {
    dispatch(loadReviews({ dentistId, token: session.accessToken }));
  }
}, [dentistId, session]);

  // New review form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const handleSubmitReview = async () => {
    if (!user) return;
    if (userReview) {
      toast.error("You can submit only one review per dentist.");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    setIsSubmitting(true);
    const result = await dispatch(
      addReview({
        dentistId: dentistId!,
        userId: user.id,
        userName: user.name,
        rating: newRating,
        comment: newComment.trim(),
        token: session?.accessToken || "",
      }),
    );
    setIsSubmitting(false);
    if (addReview.fulfilled.match(result)) {
      toast.success("Review submitted!");
      setNewComment("");
      setNewRating(5);
    } else {
      toast.error(
        (result.payload as string) || "Already reviewed this dentist",
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!editComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    const result = await dispatch(
      updateReview({
        reviewId: editingId!,
        rating: editRating,
        comment: editComment.trim(),
        token: session?.accessToken || "",
      }),
    );
    if (updateReview.fulfilled.match(result)) {
      toast.success("Review updated!");
      setEditingId(null);
    } else {
      toast.error((result.payload as string) || "Failed to update review");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const result = await dispatch(deleteReview({ 
      reviewId: deletingId, 
      token: session?.accessToken || "" 
    }));
    if (deleteReview.fulfilled.match(result)) {
      toast.success("Review deleted");
      setDeletingId(null);
    } else {
      toast.error("Failed to delete review");
    }
  };

  const expertiseColors: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    "Orthodontics & Cosmetic Dentistry": {
      bg: "#f5f3ff",
      text: "#7c3aed",
      border: "#ddd6fe",
    },
    "Oral Surgery & Implants": {
      bg: "#fff1f2",
      text: "#be123c",
      border: "#fecdd3",
    },
    "Pediatric Dentistry": {
      bg: "#f0fdf4",
      text: "#15803d",
      border: "#bbf7d0",
    },
    "Periodontics & Endodontics": {
      bg: "#fffbeb",
      text: "#b45309",
      border: "#fde68a",
    },
    "General Dentistry & Teeth Whitening": {
      bg: "#f0f9ff",
      text: "#0369a1",
      border: "#bae6fd",
    },
    "Prosthodontics & Dental Restoration": {
      bg: "#eef2ff",
      text: "#4338ca",
      border: "#c7d2fe",
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <LinearProgress />
          <div className="text-center mt-4 text-slate-500">Loading dentist information...</div>
        </div>
      </div>
    );
  }

  if (!dentist) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h2 className="text-slate-700 mb-4" style={{ fontWeight: 600 }}>
            Dentist not found
          </h2>
          <MuiButton
            variant="outlined"
            onClick={() => router.back()}
            sx={{ borderRadius: "10px" }}
          >
            Go Back
          </MuiButton>
        </div>
      </div>
    );
  }

  const colors = expertiseColors[dentist.areaOfExpertise] ?? {
    bg: "#eff6ff",
    text: "#2563eb",
    border: "#bfdbfe",
  };

  const ratingDist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: dentistReviews.filter((r: any) => r.rating === s).length,
    pct:
      dentistReviews.length > 0
        ? (dentistReviews.filter((r: any) => r.rating === s).length /
            dentistReviews.length) *
          100
        : 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Dentist Profile Card */}
        <Paper
          sx={{
            mb: 3,
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #f1f5f9",
          }}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-56 h-48 sm:h-auto flex-shrink-0 bg-slate-100 flex items-center justify-center">
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: '#3b82f6' }}
              >
                {dentist.name.charAt(0).toUpperCase()}
              </Avatar>
            </div>
            <div className="flex-1 p-6">
              <Chip
                label={dentist.areaOfExpertise}
                size="small"
                sx={{
                  bgcolor: colors.bg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  mb: 1.5,
                }}
              />
              <h1
                className="text-slate-900 mb-2"
                style={{ fontSize: "1.5rem", fontWeight: 700 }}
              >
                {dentist.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  {dentist.yearsOfExperience} years of experience
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Available for booking
                </span>
              </div>

              {/* Rating Summary */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl w-fit">
                <div className="text-center">
                  <div
                    className="text-slate-900"
                    style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1 }}
                  >
                    {dentistReviews.length > 0 ? avgRating.toFixed(1) : "—"}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">out of 5</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <Rating
                    value={avgRating}
                    precision={0.5}
                    readOnly
                    size="small"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    {dentistReviews.length} review
                    {dentistReviews.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {isAuthenticated && !isAdmin && (
                <MuiButton
                  variant="contained"
                  size="small"
                  startIcon={<Calendar size={14} />}
                  onClick={() => router.push("/create-booking")}
                  sx={{ mt: 2.5, borderRadius: "8px", fontWeight: 600 }}
                >
                  Book Appointment
                </MuiButton>
              )}
            </div>
          </div>
        </Paper>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Form + Stats ─────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5">
            {/* Rating Distribution */}
            {dentistReviews.length > 0 && (
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <h3
                  className="text-slate-700 text-sm mb-4"
                  style={{ fontWeight: 600 }}
                >
                  Rating Distribution
                </h3>
                <div className="space-y-2">
                  {ratingDist.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-3">{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": { bgcolor: "#fbbf24" },
                        }}
                      />
                      <span className="text-xs text-slate-400 w-4 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </Paper>
            )}

            {/* User's Existing Review */}
            {userReview && (
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px solid #bfdbfe",
                  bgcolor: "#f0f9ff",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-slate-700 text-sm"
                    style={{ fontWeight: 600 }}
                  >
                    Your Review
                  </h3>
                  {editingId !== userReview.id && (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => {
                          setEditingId(userReview.id);
                          setEditRating(userReview.rating);
                          setEditComment(userReview.comment);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(userReview.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === userReview.id ? (
                  <div className="space-y-3">
                    <div>
                      <p
                        className="text-xs text-slate-500 mb-1"
                        style={{ fontWeight: 500 }}
                      >
                        Rating
                      </p>
                      <Rating
                        value={editRating}
                        onChange={(_, v) => setEditRating(v ?? 1)}
                        size="medium"
                      />
                    </div>
                    <TextField
                      multiline
                      rows={3}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      size="small"
                      placeholder="Your comment..."
                    />
                    <div className="flex gap-2 my-10">
                      <MuiButton
                        variant="contained"
                        size="small"
                        onClick={handleSaveEdit}
                        sx={{ flex: 1, borderRadius: "8px" }}
                      >
                        Save
                      </MuiButton>
                      <MuiButton
                        variant="outlined"
                        size="small"
                        onClick={() => setEditingId(null)}
                        sx={{ borderRadius: "8px", minWidth: 0, px: 1.5 }}
                      >
                        <X size={14} />
                      </MuiButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <Rating value={userReview.rating} readOnly size="small" />
                    <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                      "{userReview.comment}"
                    </p>
                    <div className="text-xs text-slate-400 mt-2">
                      {userReview.updatedAt
                        ? `Edited ${formatDate(userReview.updatedAt)}`
                        : formatDate(userReview.createdAt)}
                    </div>
                  </>
                )}
              </Paper>
            )}

            {/* New Review Form */}
            {canReview && (
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                }}
              >
                <h3 className="text-slate-800 mb-4" style={{ fontWeight: 600 }}>
                  Leave a Review
                </h3>
                <div className="space-y-4">
                  <div>
                    <p
                      className="text-xs text-slate-500 mb-2"
                      style={{ fontWeight: 500 }}
                    >
                      Your Rating
                    </p>
                    <Rating
                      value={newRating}
                      onChange={(_, v) => setNewRating(v ?? 1)}
                      size="large"
                    />
                  </div>
                  <TextField
                    label="Your Comment"
                    multiline
                    rows={4}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience..."
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <div className="my-10" />
                  <MuiButton
                    variant="contained"
                    fullWidth
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || !newComment.trim()}
                    startIcon={<MessageSquare size={15} />}
                    sx={{ height: 40, borderRadius: "10px" }}
                  >
                    Submit Review
                  </MuiButton>
                </div>
              </Paper>
            )}

            {/* Login prompt */}
            {!isAuthenticated && (
              <Paper
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  border: "1px solid #bfdbfe",
                  bgcolor: "#eff6ff",
                  textAlign: "center",
                }}
              >
                <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-slate-600 text-sm mb-3">
                  Sign in to leave a review
                </p>
                <MuiButton
                  variant="contained"
                  size="small"
                  onClick={() => router.push("/login")}
                  sx={{ borderRadius: "8px" }}
                >
                  Sign In
                </MuiButton>
              </Paper>
            )}
          </div>

          {/* ── Right: Reviews List ────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Paper
              sx={{
                borderRadius: "16px",
                border: "1px solid #f1f5f9",
                overflow: "hidden",
              }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-slate-800" style={{ fontWeight: 600 }}>
                  Patient Reviews
                </h2>
                <span className="text-sm text-slate-400">
                  {dentistReviews.length} total
                </span>
              </div>

              {dentistReviews.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3
                    className="text-slate-600 mb-1"
                    style={{ fontWeight: 500 }}
                  >
                    No reviews yet
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Be the first to share your experience!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {dentistReviews
                    .slice()
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((review: any) => {
                      const isOwner = user?.id === review.userId;
                      const isEditingThis = editingId === review.id && isOwner;

                      return (
                        <div
                          key={review.id}
                          className="p-5 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                bgcolor: "#dbeafe",
                                color: "#2563eb",
                                fontSize: "0.8rem",
                                fontWeight: 700,
                              }}
                            >
                              {review.userName.charAt(0).toUpperCase()}
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span
                                      className="text-slate-800 text-sm"
                                      style={{ fontWeight: 600 }}
                                    >
                                      {review.userName}
                                    </span>
                                    {isOwner && (
                                      <Chip
                                        label="You"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{
                                          height: 18,
                                          fontSize: "0.65rem",
                                          "& .MuiChip-label": { px: 1 },
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Rating
                                      value={review.rating}
                                      readOnly
                                      size="small"
                                      sx={{ fontSize: "0.9rem" }}
                                    />
                                    <span className="text-xs text-slate-400">
                                      {review.updatedAt
                                        ? `Edited ${formatDate(review.updatedAt)}`
                                        : formatDate(review.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-0.5">
                                  {isOwner && !isAdmin && (
                                    <button
                                      onClick={() => {
                                        setEditingId(review.id);
                                        setEditRating(review.rating);
                                        setEditComment(review.comment);
                                      }}
                                      className="p-1.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {(isOwner || isAdmin) && (
                                    <button
                                      onClick={() => setDeletingId(review.id)}
                                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Comment or inline edit */}
                              {isEditingThis ? (
                                <div className="mt-3 space-y-3">
                                  <Rating
                                    value={editRating}
                                    onChange={(_, v) => setEditRating(v ?? 1)}
                                  />
                                  <TextField
                                    multiline
                                    rows={3}
                                    value={editComment}
                                    onChange={(e) =>
                                      setEditComment(e.target.value)
                                    }
                                    size="small"
                                  />
                                  <div className="flex gap-2 my-10">
                                    <MuiButton
                                      variant="contained"
                                      size="small"
                                      onClick={handleSaveEdit}
                                      sx={{ borderRadius: "8px", px: 2 }}
                                    >
                                      Save
                                    </MuiButton>
                                    <MuiButton
                                      variant="outlined"
                                      size="small"
                                      onClick={() => setEditingId(null)}
                                      sx={{
                                        borderRadius: "8px",
                                        minWidth: 0,
                                        px: 1.5,
                                      }}
                                    >
                                      <X size={14} />
                                    </MuiButton>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                                  "{review.comment}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Paper>
          </div>
        </div>
      </main>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Review?</DialogTitle>
        <DialogContent>
          <p className="text-slate-500 text-sm">
            {isAdmin &&
            deletingId &&
            allReviews.find((r: any) => r.id === deletingId)?.userId !==
              user?.id
              ? `Delete ${allReviews.find((r: any) => r.id === deletingId)?.userName}'s review? This cannot be undone.`
              : "Delete your review? This cannot be undone."}
          </p>
        </DialogContent>
        <DialogActions>
          <MuiButton
            onClick={() => setDeletingId(null)}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              borderColor: "#e2e8f0",
              color: "#374151",
            }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleDelete}
            variant="contained"
            sx={{
              borderRadius: "10px",
              bgcolor: "#dc2626",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}
