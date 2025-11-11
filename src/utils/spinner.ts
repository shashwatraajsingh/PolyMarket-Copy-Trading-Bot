import ora from 'ora';

const spinner = ora({
    spinner: {
        interval: 180,
        frames: [
            '[=     ]',
            '[ =    ]',
            '[  =   ]',
            '[   =  ]',
            '[    = ]',
            '[     =]',
            '[    = ]',
            '[   =  ]',
            '[  =   ]',
            '[ =    ]',
        ],
    },
});

export default spinner;
