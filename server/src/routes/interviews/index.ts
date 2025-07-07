import { AppContext } from '../..';
import { requireDb, useDb } from '../../middleware/useDb';
import { zValidator } from '../../validator-wrapper';
import { createInterview, deleteInterview, getAllInterviews } from './db-queries';
import { InterviewsDeleteRequest, InterviewsPostRequest } from './schema';
import { Hono } from 'hono';

const interviewsRoute = new Hono<AppContext>();

interviewsRoute.use('*', useDb);

interviewsRoute.get('/', async (c) => {
  const db = requireDb(c);
  const interviews = await getAllInterviews(db);
  return c.json({ interviews });
});

interviewsRoute.post('/', zValidator('json', InterviewsPostRequest), async (c) => {
  const db = requireDb(c);
  const data = c.req.valid('json');

  await createInterview(db, data.creatorId, data.startTime, data.endTime, data.invites);

  return c.json({ message: 'Interview created' }, 201);
});

interviewsRoute.delete('/:id', zValidator('param', InterviewsDeleteRequest), async (c) => {
  const db = requireDb(c);
  const { id } = c.req.valid('param');

  await deleteInterview(db, id);

  return c.body(null, 204);
});

// interviewsRoute.patch("/", (c) => {
//   return c.text("Hello Hono!");
// });

export default interviewsRoute;
