import { UserCell } from '@/components/table/UserCell';
import Notice from '@/components/Notice';
import { PeriodPageParams, SinglePeriod } from '@/model/periods';
import React from 'react';
import { useParams } from 'react-router-dom';
import { TableOptions, useTable } from 'react-table';
import { useRecoilValue } from 'recoil';
import { sortBy } from 'lodash';

const QuantifierTable = (): JSX.Element => {
  const { periodId } = useParams<PeriodPageParams>();
  const period = useRecoilValue(SinglePeriod(periodId));

  const columns = React.useMemo(
    () => [
      {
        Header: 'Quantifier',
        accessor: '_id',
        className: 'text-left',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Cell: (data: any): JSX.Element => (
          <UserCell userId={data.row.original._id} />
        ),
      },
      {
        Header: 'Finished items',
        accessor: '',
        className: 'text-center',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Cell: (data: any): JSX.Element => (
          <div>
            {`${data.row.original.finishedCount} / ${data.row.original.praiseCount}`}
          </div>
        ),
      },
    ],
    []
  );

  const data = period?.quantifiers
    ? sortBy(period.quantifiers, [
        // First, sort by amount of praise remaining
        (quantifier): number => {
          return -1 * (quantifier.finishedCount / quantifier.praiseCount);
        },

        // Then by quantifier _id
        (quantifier): string => quantifier._id.toString(),
      ])
    : [];

  const options = {
    columns,
    data,
  } as TableOptions<{}>;
  const tableInstance = useTable(options);
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  if (!period) return <div>Period not found.</div>;

  if (period.status === 'OPEN')
    return (
      <div className="w-full h-full flex items-center">
        <Notice type="danger">
          <span>No quantifiers assigned in this period</span>
        </Notice>
      </div>
    );

  if (period?.receivers?.length === 0)
    return (
      <div className="w-full h-full flex items-center">
        <Notice type="danger">
          <span>No quantifiers found in this period</span>
        </Notice>
      </div>
    );

  return (
    <table
      id="periods-table"
      className="w-full table-auto"
      {...getTableProps()}
    >
      <thead>
        {headerGroups.map((headerGroup) => (
          // eslint-disable-next-line react/jsx-key
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              // eslint-disable-next-line react/jsx-key
              <th
                {...column.getHeaderProps()}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                className={(column as any).className}
              >
                {column.render('Header')}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row) => {
          prepareRow(row);
          return (
            // eslint-disable-next-line react/jsx-key
            <tr id="" {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return (
                  // eslint-disable-next-line react/jsx-key
                  <td
                    {...cell.getCellProps()}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    className={(cell.column as any).className}
                  >
                    {cell.render('Cell')}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default QuantifierTable;
