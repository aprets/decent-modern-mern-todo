import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { InferResponseType } from 'hono';

import { APIError, api, getDecodedToken, setRawToken } from '../lib/api';

type Task = InferResponseType<typeof api.tasks.$get>[0];

const getPriorityIcon = (priority: Task['priority']) => {
  switch (priority) {
    case 'low': {
      return '⬇';
    }
    case 'medium': {
      return '➡';
    }
    case 'high': {
      return '⬆';
    }
    default: {
      return '';
    }
  }
};

const getStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'todo': {
      return 'bg-amber-500';
    }
    case 'in-progress': {
      return 'bg-blue-500';
    }
    case 'done': {
      return 'bg-green-500';
    }
    default: {
      return '';
    }
  }
};

export const Home = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoading, data } = useQuery(
    'home',
    () =>
      api.tasks
        .$get({
          query: {
            limit: '10',
            page: '1',
          },
        })
        .then((res) => res.json()),
    {
      onError: (error) => {
        if (error instanceof APIError) {
          toast.error(error.message);
        } else {
          toast.error('Unknown error');
        }
      },
    },
  );
  const { mutateAsync: mutateDelete } = useMutation(
    (id: string) =>
      api.tasks[':id'].$delete({
        param: {
          id,
        },
      }),
    {
      onSuccess: () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        queryClient.invalidateQueries('home');
      },
    },
  );
  return (
    <>
      <header className="w-full flex items-center justify-between px-4 py-4 ">
        <div className="flex items-center" />
        <div className="flex items-center">
          <span className="mr-2 select-none">👤</span>
          <span className="mr-4 select-none">{getDecodedToken()?.username ?? '...'}</span>
          <button
            type="button"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-input hover:bg-gray-50 hover:text-accent-foreground h-9 px-4 py-2"
            onClick={() => {
              setRawToken(null);
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <div className="flex flex-row justify-center">
        <button
          type="button"
          className="mt-2 py-2 px-16 border rounded-md text-sm font-medium hover:bg-gray-50"
          //   onClick={onEdit}
        >
          Add Task
        </button>
      </div>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24 mt-16">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {isLoading && (
            <>
              {Array.from({ length: 6 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="animate-pulse bg-gray-300 rounded h-72" />
              ))}
            </>
          )}
          {data &&
            data.map(({ _id, text, priority, status }) => (
              <div key={_id} className="border rounded-lg shadow-sm p-4 bg-white">
                {/* Status and priority badges */}
                <div className="flex justify-between items-center mb-6">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-bold text-white rounded capitalize ${getStatusColor(
                      status,
                    )}`}
                  >
                    {status}
                  </span>
                  <span className="text-gray-600 capitalize">
                    <span className="mr-1">{getPriorityIcon(priority)}</span>
                    {priority} priority
                  </span>
                </div>
                {/* Task text */}
                <p className="text-gray-800 font-semibold text-xl mb-4 break-words">{`${text} `.repeat(50)}</p>
                {/* Edit button */}
                <div className="flex flex-row gap-4 justify-between w-full">
                  <button
                    type="button"
                    className="w-full mt-2 py-2 px-4 border rounded-md text-sm font-medium hover:bg-gray-50"
                    //   onClick={onEdit}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="w-full mt-2 py-2 px-4 border rounded-md text-sm font-medium hover:bg-gray-50"
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onClick={async () => {
                      await mutateDelete(_id);
                      toast.success('Task deleted');
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
