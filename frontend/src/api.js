async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = `Erreur ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  changePassword: (payload) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),

  listParticipants: () => request('/participants'),
  getParticipant: (id) => request(`/participants/${id}`),
  createParticipant: (payload) => request('/participants', { method: 'POST', body: JSON.stringify(payload) }),
  updateParticipant: (id, payload) => request(`/participants/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteParticipant: (id) => request(`/participants/${id}`, { method: 'DELETE' }),
  resetPassword: (id) => request(`/participants/${id}/reset-password`, { method: 'POST' }),

  listEvents: () => request('/events'),
  createEvent: (payload) => request('/events', { method: 'POST', body: JSON.stringify(payload) }),
  updateEvent: (id, payload) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),
  rsvpEvent: (id, status) => request(`/events/${id}/rsvp`, { method: 'PUT', body: JSON.stringify({ status }) }),

  listItems: () => request('/items'),
  createItem: (payload) => request('/items', { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (id, payload) => request(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteItem: (id) => request(`/items/${id}`, { method: 'DELETE' }),
  borrowItem: (id) => request(`/items/${id}/borrow`, { method: 'POST' }),
  returnItem: (id) => request(`/items/${id}/return`, { method: 'POST' }),

  listFeedback: () => request('/feedback'),
  createFeedback: (payload) => request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  toggleResolveFeedback: (id) => request(`/feedback/${id}/resolve`, { method: 'POST' }),
  deleteFeedback: (id) => request(`/feedback/${id}`, { method: 'DELETE' }),

  getInviteCode: () => request('/settings/invite-code'),
  regenerateInviteCode: () => request('/settings/invite-code/regenerate', { method: 'POST' }),

  listPosts: () => request('/posts'),
  createPost: (payload) => request('/posts', { method: 'POST', body: JSON.stringify(payload) }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  reactToPost: (id, emoji) => request(`/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
}
