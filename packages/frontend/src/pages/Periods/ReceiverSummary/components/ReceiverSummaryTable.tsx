import { UserAvatar } from '@/components/user/UserAvatar';
import { usePeriodReceiverPraiseQuery } from '@/model/periods';
import { formatDate } from '@/utils/date';
import { PraiseDetailsDto } from 'api/dist/praise/types';
import React from 'react';
import { useHistory, useParams } from 'react-router-dom';

interface PraiseRowProps {
  praise: PraiseDetailsDto;
}
const PraiseRow = ({ praise }: PraiseRowProps) => {
  const history = useHistory();

  const handleClick = () => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    history.push(`/praise/${praise._id}`);
  };

  return (
    <div
      className="flex items-center w-full p-5 cursor-pointer hover:bg-gray-100"
      onClick={handleClick}
    >
      <div className="flex items-center">
        <UserAvatar userAccount={praise.giver} />
      </div>
      <div className="ml-5 overflow-hidden">
        <div>
          <span className="font-bold">{praise.giver.name}</span>
          <span className="ml-3 text-xs text-gray-500">
            {formatDate(praise.createdAt)}
          </span>
        </div>
        <div>{praise.reason}</div>
      </div>
      <div className="flex-grow text-right px-14 whitespace-nowrap">
        {praise.score}
      </div>
    </div>
  );
};

const PeriodReceiverTable = () => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const { periodId, receiverId } = useParams() as any;
  const praiseList = usePeriodReceiverPraiseQuery(periodId, receiverId);

  if (!praiseList) return null;
  return (
    <div>
      {praiseList?.map((praise) => (
        <PraiseRow praise={praise} key={praise?._id} />
      ))}
    </div>
  );
};

export default PeriodReceiverTable;
