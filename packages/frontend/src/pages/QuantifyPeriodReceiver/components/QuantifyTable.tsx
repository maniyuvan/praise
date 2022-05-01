import { InlineLabel } from '@/components/InlineLabel';
import { ForwarderTooltip } from '@/components/praise/ForwarderTooltip';
import { UserAvatar } from '@/components/user/UserAvatar';
import { UserPseudonym } from '@/components/user/UserPseudonym';
import { ActiveUserId } from '@/model/auth';
import {
  PeriodAndReceiverPageParams,
  PeriodQuantifierReceiverPraise,
} from '@/model/periods';
import { useQuantifyPraise } from '@/model/praise';
import { usePeriodSettingValueRealized } from '@/model/periodsettings';
import { localizeAndFormatIsoDate } from '@/utils/date';
import {
  faCopy,
  faTimes,
  faMinusCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dialog } from '@headlessui/react';
import getWeek from 'date-fns/getWeek';
import parseISO from 'date-fns/parseISO';
import { groupBy } from 'lodash';
import { PraiseDto, QuantificationDto } from 'api/dist/praise/types';
import React from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { QuantifyBackNextLink } from './BackNextLink';
import DismissDialog from './DismissDialog';
import DuplicateDialog from './DuplicateDialog';
import QuantifySlider from './QuantifySlider';

const getRemoveButton = (callback: () => void): JSX.Element => {
  return (
    <button onClick={callback} className="ml-2">
      <FontAwesomeIcon
        className="text-white text-opacity-50 hover:text-opacity-100"
        icon={faTimes}
        size="1x"
      />
    </button>
  );
};

const QuantifyTable = (): JSX.Element | null => {
  const { periodId, receiverId } = useParams<PeriodAndReceiverPageParams>();
  const userId = useRecoilValue(ActiveUserId);
  const data = useRecoilValue(
    PeriodQuantifierReceiverPraise({ periodId, receiverId })
  );
  const usePseudonyms = usePeriodSettingValueRealized(
    periodId,
    'PRAISE_QUANTIFY_RECEIVER_PSEUDONYMS'
  ) as boolean;
  const { quantify } = useQuantifyPraise();

  const [isDismissDialogOpen, setIsDismissDialogOpen] = React.useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] =
    React.useState(false);
  const [selectedPraise, setSelectedPraise] = React.useState<
    PraiseDto | undefined
  >(undefined);
  const [selectedPraiseIds, setSelectedPraiseIds] = React.useState<string[]>(
    []
  );

  if (!data) return null;

  const quantification = (praise: PraiseDto): QuantificationDto | undefined => {
    return praise.quantifications.find((q) => q.quantifier === userId);
  };

  const dismissed = (praise: PraiseDto): boolean => {
    const q = quantification(praise);
    return q ? !!q.dismissed : false;
  };

  const duplicate = (praise: PraiseDto): boolean => {
    const q = quantification(praise);
    return q ? (q.duplicatePraise ? true : false) : false;
  };

  const handleDismiss = (): void => {
    if (selectedPraiseIds.length > 0) {
      selectedPraiseIds.forEach((praiseId) => {
        void quantify(praiseId, 0, true, null);
      });

      setSelectedPraiseIds([]);
    }
  };

  const handleDuplicate = (duplicatePraiseId: string): void => {
    if (selectedPraise)
      void quantify(selectedPraise._id, 0, false, duplicatePraiseId);
  };

  const handleRemoveDismiss = (): void => {
    if (selectedPraise) void quantify(selectedPraise._id, 0, false, null);
  };

  const handleRemoveDuplicate = (): void => {
    if (selectedPraise) void quantify(selectedPraise._id, 0, false, null);
  };

  const handleToggleCheckbox = (praiseId: string): void => {
    if (selectedPraiseIds.includes(praiseId)) {
      const newSelectedPraiseIds = selectedPraiseIds.filter(
        (p) => p !== praiseId
      );

      setSelectedPraiseIds(newSelectedPraiseIds);
    } else {
      setSelectedPraiseIds([...selectedPraiseIds, praiseId]);
    }
  };

  const shortDuplicatePraiseId = (praise: PraiseDto): string => {
    const q = quantification(praise);
    return q && q.duplicatePraise ? q.duplicatePraise?.slice(-4) : '';
  };

  const weeklyData = groupBy(data, (praise: PraiseDto) => {
    if (!praise) return 0;
    return getWeek(parseISO(praise.createdAt), { weekStartsOn: 1 });
  });

  return (
    <>
      <div className="p-5 relative space-x-2 bg-gray-200 w-full flex justify-start flex-wrap ">
        <button
          disabled={selectedPraiseIds.length === 0}
          className={
            selectedPraiseIds.length === 0
              ? 'praise-button-disabled space-x-2'
              : 'praise-button space-x-2'
          }
          onClick={(): void => setIsDismissDialogOpen(true)}
        >
          <FontAwesomeIcon icon={faMinusCircle} size="1x" />
          <span>Dismiss</span>
        </button>
        <button
          disabled={selectedPraiseIds.length < 2}
          className={
            selectedPraiseIds.length < 2
              ? 'praise-button-disabled space-x-2'
              : 'praise-button space-x-2'
          }
        >
          <FontAwesomeIcon icon={faCopy} size="1x" />
          <span>Mark as duplicates</span>
        </button>
      </div>
      <table className="w-full table-auto">
        <tbody>
          {Object.keys(weeklyData).map((weekKey, index) => (
            <>
              {index !== 0 && index !== data.length - 1 && (
                <tr>
                  <td colSpan={3}>
                    <div className="border-t border-2 border-gray-400 my-4" />
                  </td>
                </tr>
              )}

              {weeklyData[weekKey].map((praise, index) => (
                <tr
                  key={index}
                  onMouseDown={(): void => setSelectedPraise(praise)}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="mr-4"
                      checked={selectedPraiseIds.includes(praise._id)}
                      onChange={(): void => handleToggleCheckbox(praise._id)}
                    />
                  </td>
                  <td>
                    <div className="items-center w-full">
                      <div className="flex items-center">
                        <UserAvatar
                          userAccount={praise.giver}
                          usePseudonym={usePseudonyms}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="font-bold">
                        <ForwarderTooltip praise={praise} />
                        {usePseudonyms ? (
                          <UserPseudonym
                            userId={praise.giver._id}
                            periodId={periodId}
                          />
                        ) : (
                          praise.giver.name
                        )}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {localizeAndFormatIsoDate(praise.createdAt)}
                      </span>
                    </div>
                    <div className="w-[550px] overflow-hidden overflow-ellipsis">
                      <span>
                        <InlineLabel
                          text={`#${praise._id.slice(-4)}`}
                          className="bg-gray-400"
                        />
                        {dismissed(praise) ? (
                          <>
                            <InlineLabel
                              text="Dismissed"
                              button={getRemoveButton(handleRemoveDismiss)}
                              className="bg-red-600"
                            />
                            <span className="line-through">
                              {praise.reason}
                            </span>
                          </>
                        ) : duplicate(praise) ? (
                          <>
                            <InlineLabel
                              text={`Duplicate of: #${shortDuplicatePraiseId(
                                praise
                              )}`}
                              button={getRemoveButton(handleRemoveDuplicate)}
                            />
                            <span className="text-gray-400">
                              {praise.reason}
                            </span>
                          </>
                        ) : (
                          praise.reason
                        )}
                      </span>
                    </div>
                  </td>
                  <td>
                    <QuantifySlider praise={praise} periodId={periodId} />
                  </td>
                </tr>
              ))}
            </>
          ))}

          <React.Suspense fallback={null}>
            <Dialog
              open={isDismissDialogOpen && !!selectedPraise}
              onClose={(): void => setIsDismissDialogOpen(false)}
              className="fixed inset-0 z-10 overflow-y-auto"
            >
              <DismissDialog
                praiseIds={selectedPraiseIds}
                onClose={(): void => setIsDismissDialogOpen(false)}
                onDismiss={(): void => handleDismiss()}
              />
            </Dialog>
          </React.Suspense>

          <React.Suspense fallback={null}>
            <DuplicateDialog
              open={isDuplicateDialogOpen}
              praise={selectedPraise}
              onClose={(): void => setIsDuplicateDialogOpen(false)}
              onSelect={handleDuplicate}
            />
          </React.Suspense>
        </tbody>
      </table>
      <QuantifyBackNextLink />
    </>
  );
};

export default QuantifyTable;
