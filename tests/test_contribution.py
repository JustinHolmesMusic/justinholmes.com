from __future__ import annotations
import ape
import pytest


def test_properties(chain, contribution: ape.Contract, owner: ape.Account, receiver: ape.Account, threshold: int, countdownPeriod: int):
    assert owner == contribution.owner()
    assert receiver == contribution.beneficiary()
    assert contribution.countdownPeriod() == countdownPeriod
    assert contribution.threshold() == threshold
    assert contribution.deadline() > chain.pending_timestamp


def test_not_being_able_to_contribute_after_deadline(chain: ape.chain, contribution: ape.Contract, owner: ape.Account, not_owner: ape.Account, countdownPeriod: int):

    # contribution before deadline should work
    # transfer 1 wei from not_owner to contribution contract
    #  function contribute() external payable {
    contribution.contribute(sender=not_owner, value=1)

    # contribution after deadline should fail
    chain.provider.set_timestamp(chain.pending_timestamp + countdownPeriod + 1)

    with pytest.raises(Exception):
        contribution.contribute(sender=not_owner, value=1)
