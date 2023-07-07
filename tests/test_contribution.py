from __future__ import annotations
import ape
import pytest

# def test_authorization(contribution, owner, not_owner):
#     contribution.set_owner(sender=owner)
#     assert owner == contribution.owner()
# 
#     with ape.reverts("!authorized"):
#         contribution.authorized_method(sender=not_owner)
# 
# 

def test_properties(chain, contribution: ape.Contract, owner: ape.Account, receiver: ape.Account, deadline: int, threshold: int):
    assert owner == contribution.owner()
    assert receiver == contribution.beneficiary()

    assert contribution.deadline() > chain.pending_timestamp
    assert contribution.threshold() == threshold


# def test_contributions(contribution: ape.Contract, owner: ape.Account, receiver: ape.Account):
#     assert 0 == contribution.total_contributions()
#     assert 0 == contribution.contributions(ow